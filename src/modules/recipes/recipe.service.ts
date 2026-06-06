import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from '@/database/prisma/prisma.service';
import { Recipe, Prisma } from '@/generated/prisma/client';
import { CreateRecipeDto, GetRecipesQueryDto } from './dto';
import { UserModel } from '@/generated/prisma/models';
import type { RecipeImageFiles } from './pipes/recipe-images-validation.pipe';
import {
  assertRecipeImageInput,
  publicIdFromImageUrl,
  type ResolvedRecipeImage,
} from './pipes/recipe-images-validation.pipe';
import { CloudinaryService } from '@/services/cloudinary';
import { RecipeResponse } from './types/recipe-response.type';
import { RecipeInteractionsFacade } from '../recipe-interactions/recipe-interactions.facade';
import { OpenAiService, RecipeLlmParseResult } from '@/services/openai';
import { YtdlpService } from '@/services/ytdlp';
import { GeneratedRecipeImage, UnsplashService } from '@/services/unsplash';
import type { VideoRecipeParse } from '@/generated/prisma/client';

@Injectable()
export class RecipesService {
  private readonly logger = new Logger(RecipesService.name);

  constructor(
    private prisma: PrismaService,
    private cloudinaryService: CloudinaryService,
    private recipeInteractionsFacade: RecipeInteractionsFacade,
    private ytdlpService: YtdlpService,
    private openAiService: OpenAiService,
    private unsplashService: UnsplashService,
  ) {}

  private async buildWhere({
    search,
    ingredients,
    categories,
  }: GetRecipesQueryDto): Promise<{
    where: Prisma.RecipeWhereInput;
    matchedMap: Map<string, Set<string>>;
  }> {
    const where: Prisma.RecipeWhereInput = {};
    const matchedMap = new Map<string, Set<string>>();

    let searchIds: string[] | null = null;
    let ingredientIds: string[] | null = null;

    if (search) {
      const results = await this.prisma.$queryRaw<{ id: string }[]>`
    SELECT id FROM public."Recipe"
    WHERE similarity(title, ${search}) > 0.4
    OR title ILIKE ${'%' + search + '%'}
    OR levenshtein(lower(title), lower(${search})) <= 2
  `;
      searchIds = results.map((r) => r.id);
    }

    if (ingredients) {
      const list = ingredients.split(',').map((i) => i.trim());
      const idSets = await Promise.all(
        list.map(async (ing) => {
          const results = await this.prisma.$queryRaw<
            { id: string; name: string }[]
          >`
      SELECT DISTINCT r.id, i.name
      FROM public."Recipe" r
      JOIN public."RecipeIngredient" i ON i."recipeId" = r.id
      WHERE similarity(i.name, ${ing}) > 0.4
      OR i.name ILIKE ${'%' + ing + '%'}
      OR levenshtein(lower(i.name), lower(${ing})) <= 1
    `;
          return {
            ids: new Set(results.map((r) => r.id)),
            matched: results, // { id, name }[]
          };
        }),
      );

      const intersected = [...idSets[0].ids].filter((id) =>
        idSets.every((set) => set.ids.has(id)),
      );

      ingredientIds = intersected;

      for (const { matched } of idSets) {
        for (const row of matched) {
          if (!intersected.includes(row.id)) continue;
          if (!matchedMap.has(row.id)) matchedMap.set(row.id, new Set());
          matchedMap.get(row.id)!.add(row.name); // реальное имя из БД
        }
      }
    }

    if (searchIds && ingredientIds) {
      where.id = { in: searchIds.filter((id) => ingredientIds.includes(id)) };
    } else if (searchIds) {
      where.id = { in: searchIds };
    } else if (ingredientIds) {
      where.id = { in: ingredientIds };
    }

    if (categories) {
      const list = categories.split(',').map((i) => i.trim());
      where.categoryId = { in: list };
    }

    return { where, matchedMap };
  }
  private async resolveRecipeImages(
    files: RecipeImageFiles,
    mainImageUrl?: string,
    previewImageUrl?: string,
  ): Promise<{
    mainImage: ResolvedRecipeImage;
    previewImage: ResolvedRecipeImage;
  }> {
    assertRecipeImageInput(files, mainImageUrl, previewImageUrl);

    const resolveOne = async (
      file: Express.Multer.File[] | undefined,
      url: string | undefined,
    ): Promise<ResolvedRecipeImage> => {
      if (file?.[0]) {
        const uploaded = await this.cloudinaryService.uploadImage(file[0]);

        return {
          imageUrl: uploaded.secure_url,
          publicId: uploaded.public_id,
        };
      }

      const imageUrl = url!.trim();

      return {
        imageUrl,
        publicId: publicIdFromImageUrl(imageUrl),
      };
    };

    const [mainImage, previewImage] = await Promise.all([
      resolveOne(files.mainImage, mainImageUrl),
      resolveOne(files.previewImage, previewImageUrl),
    ]);

    return { mainImage, previewImage };
  }

  private isCloudinaryImage(imageUrl: string): boolean {
    return imageUrl.includes('res.cloudinary.com');
  }

  private async deleteStoredImageIfCloudinary(
    imageUrl: string,
    publicId: string,
  ): Promise<void> {
    if (!this.isCloudinaryImage(imageUrl)) {
      return;
    }

    try {
      await this.cloudinaryService.deleteImage(publicId);
    } catch {
      // ignore cleanup errors for stale/missing cloudinary assets
    }
  }

  async recipe(
    recipeWhereUniqueInput: Prisma.RecipeWhereUniqueInput,
    include?: Prisma.RecipeInclude,
    user?: UserModel,
  ): Promise<RecipeResponse> {
    const recipe = await this.prisma.recipe.findUnique({
      where: recipeWhereUniqueInput,
      include,
    });

    if (!recipe) {
      throw new HttpException('Recipe not found', HttpStatus.NOT_FOUND);
    }

    if (user) {
      await this.recipeInteractionsFacade.addRecentlyViewedRecipe(
        user.id,
        recipe.id,
      );
    }

    const userRating =
      user &&
      (await this.prisma.recipeRating.findUnique({
        where: { userId_recipeId: { userId: user.id, recipeId: recipe.id } },
        select: { rating: true },
      }));

    return { ...recipe, userRating: userRating?.rating };
  }

  async generateRecipeFromVideoUrl(
    url: string,
    user: UserModel,
  ): Promise<{ recipe: RecipeLlmParseResult }> {
    const normalizedUrl = url.trim().split('?')[0];
    this.logger.log(`recipe LLM test started: ${normalizedUrl}`);

    const cachedVideo = await this.prisma.videoRecipeParse.findFirst({
      where: {
        userId: user.id,
        OR: [{ normalizedUrl: normalizedUrl }, { sourceUrl: normalizedUrl }],
      },
    });

    if (cachedVideo) {
      await new Promise((resolve) => setTimeout(resolve, 60000));
      return {
        recipe: {
          ...this.mapVideoParseToRecipe(cachedVideo),
          images: this.mapVideoParseToImages(cachedVideo),
        },
      };
    }

    const extract = await this.ytdlpService.extract(normalizedUrl, {
      includeSubtitles: true,
    });

    const recipe = await this.openAiService.parseRecipeFromVideo(extract);

    if (!recipe.isRecipe) {
      throw new UnprocessableEntityException('В відео не знайдено рецепт');
    }

    const images = await this.unsplashService.findRecipeImages(
      recipe.imageSearchQuery || '',
    );

    await this.prisma.videoRecipeParse.upsert({
      where: {
        userId_platformVideoId: {
          userId: user.id,
          platformVideoId: extract.platformVideoId,
        },
      },
      create: {
        userId: user.id,
        platformVideoId: extract.platformVideoId,
        sourceUrl: extract.sourceUrl,
        normalizedUrl: normalizedUrl,
        status: 'SUCCESS',
        title: recipe.title,
        description: recipe.description,
        cookingTimeInMinutes: recipe.cookingTimeInMinutes,
        ingredients: recipe.ingredients as unknown as Prisma.InputJsonValue,
        suggestedCategoryName: recipe.suggestedCategoryName,
        imageSearchQuery: recipe.imageSearchQuery,
        images: images as unknown as Prisma.InputJsonValue,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
      },
      update: {
        userId: user.id,
        platformVideoId: extract.platformVideoId,
        sourceUrl: extract.sourceUrl,
        normalizedUrl: normalizedUrl,
        status: 'SUCCESS',
        title: recipe.title,
        description: recipe.description,
        cookingTimeInMinutes: recipe.cookingTimeInMinutes,
        ingredients: recipe.ingredients as unknown as Prisma.InputJsonValue,
        suggestedCategoryName: recipe.suggestedCategoryName,
        imageSearchQuery: recipe.imageSearchQuery,
        images: images as unknown as Prisma.InputJsonValue,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
      },
    });

    this.logger.log(`recipe LLM test finished, video_url=${extract.sourceUrl}`);

    return { recipe: { ...recipe, images } };
  }

  private mapVideoParseToRecipe(
    cached: VideoRecipeParse,
  ): RecipeLlmParseResult {
    const ingredients = Array.isArray(cached.ingredients)
      ? (cached.ingredients as unknown as RecipeLlmParseResult['ingredients'])
      : [];

    return {
      isRecipe: true,
      title: cached.title ?? undefined,
      description: cached.description ?? undefined,
      cookingTimeInMinutes: cached.cookingTimeInMinutes ?? undefined,
      ingredients,
      suggestedCategoryName: cached.suggestedCategoryName ?? undefined,
      imageSearchQuery: cached.imageSearchQuery ?? undefined,
    };
  }

  private mapVideoParseToImages(
    cached: VideoRecipeParse,
  ): GeneratedRecipeImage[] {
    if (!Array.isArray(cached.images)) {
      return [];
    }

    return cached.images
      .map((item) => {
        if (!item || typeof item !== 'object') {
          return null;
        }

        const image = item as Record<string, unknown>;
        const imageUrl =
          typeof image.imageUrl === 'string' ? image.imageUrl.trim() : '';
        const publicId =
          typeof image.publicId === 'string' ? image.publicId.trim() : '';
        const type = image.type;

        if (!imageUrl || !publicId || (type !== 'MAIN' && type !== 'PREVIEW')) {
          return null;
        }

        return { imageUrl, publicId, type };
      })
      .filter((item): item is GeneratedRecipeImage => item !== null);
  }

  async recipes(
    query: GetRecipesQueryDto,
    user?: UserModel,
  ): Promise<RecipeResponse[]> {
    const { where, matchedMap } = await this.buildWhere(query);

    const recipes = await this.prisma.recipe.findMany({
      where,
      include: {
        category: true,
        ingredients: true,
        images: true,
        favoriteRecipes: user
          ? {
              where: {
                userId: user?.id,
              },
              select: {
                userId: true,
              },
            }
          : undefined,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return recipes
      .map((recipe) => ({
        ...recipe,
        isFavorite: recipe.favoriteRecipes?.length > 0,
        ingredients: recipe.ingredients
          .map((ing) => ({
            ...ing,
            matched: matchedMap.get(recipe.id)?.has(ing.name) ?? false,
          }))
          .sort((a, b) => Number(b.matched) - Number(a.matched)),
        matchedCount: matchedMap.get(recipe.id)?.size ?? 0,
      }))
      .sort((a, b) => b.matchedCount - a.matchedCount);
  }

  async favoriteRecipes(user: UserModel): Promise<Recipe[]> {
    const recipes = await this.prisma.recipe.findMany({
      where: {
        favoriteRecipes: {
          some: {
            userId: user.id,
          },
        },
      },
      include: { category: true, ingredients: true, images: true },
    });

    return recipes.map((recipe) => ({
      ...recipe,
      isFavorite: true,
    }));
  }

  async recentlyViewedRecipes(user: UserModel): Promise<Recipe[]> {
    const result = await this.prisma.recentlyViewedRecipe.findMany({
      where: { userId: user.id },
      orderBy: { viewedAt: 'desc' },
      include: {
        recipe: {
          include: {
            category: true,
            ingredients: true,
            images: true,
          },
        },
      },
    });

    return result.map((r) => r.recipe);
  }

  async createRecipe({
    files,
    recipe,
    user,
  }: {
    files: RecipeImageFiles;
    recipe: CreateRecipeDto;
    user?: UserModel;
  }): Promise<Recipe> {
    const {
      title,
      description,
      ingredients,
      categoryId,
      cookingTimeInMinutes,
      mainImage: mainImageUrl,
      previewImage: previewImageUrl,
    } = recipe;
    const authorId = user?.id;

    const { mainImage, previewImage } = await this.resolveRecipeImages(
      files,
      mainImageUrl,
      previewImageUrl,
    );

    return this.prisma.recipe.create({
      data: {
        title,
        description,
        cookingTimeInMinutes,
        category: { connect: { id: categoryId } },
        ingredients: {
          create: ingredients.map((ing) => ({
            name: ing.name,
            amount: ing.amount,
            unit: ing.unit,
          })),
        },
        images: {
          create: [
            {
              imageUrl: previewImage.imageUrl,
              publicId: previewImage.publicId,
              type: 'PREVIEW',
            },
            {
              imageUrl: mainImage.imageUrl,
              publicId: mainImage.publicId,
              type: 'MAIN',
            },
          ],
        },
        ...(authorId && {
          user: {
            connect: { id: authorId },
          },
        }),
      },
      include: { ingredients: true, category: true, images: true },
    });
  }

  async updateRecipe(
    id: string,
    {
      ingredients,
      mainImage,
      previewImage,
      ...fields
    }: Partial<CreateRecipeDto>,
    newImages?: Partial<RecipeImageFiles>,
  ): Promise<Recipe> {
    const data: Prisma.RecipeUpdateInput = { ...fields };
    const currentRecipe = await this.prisma.recipe.findUnique({
      where: { id },
      include: { images: true },
    });

    if (!currentRecipe)
      throw new HttpException('Recipe not found', HttpStatus.NOT_FOUND);

    const updateImage = async (
      type: 'MAIN' | 'PREVIEW',
      newImage: Express.Multer.File[] | undefined,
      newImageUrl: string | undefined,
    ): Promise<ResolvedRecipeImage | null> => {
      const hasFile = Boolean(newImage?.[0]);
      const hasUrl = Boolean(newImageUrl?.trim());

      if (!hasFile && !hasUrl) {
        return null;
      }

      if (hasFile && hasUrl) {
        throw new HttpException(
          `Provide ${type === 'MAIN' ? 'mainImage' : 'previewImage'} either as a file or as a URL, not both`,
          HttpStatus.BAD_REQUEST,
        );
      }

      const current = currentRecipe.images.find((img) => img.type === type);

      if (hasFile) {
        const uploaded = await this.cloudinaryService.uploadImage(newImage![0]);

        if (current) {
          await this.deleteStoredImageIfCloudinary(
            current.imageUrl,
            current.publicId,
          );
        }

        return {
          imageUrl: uploaded.secure_url,
          publicId: uploaded.public_id,
        };
      }

      const imageUrl = newImageUrl!.trim();

      if (current) {
        await this.deleteStoredImageIfCloudinary(
          current.imageUrl,
          current.publicId,
        );
      }

      return {
        imageUrl,
        publicId: publicIdFromImageUrl(imageUrl),
      };
    };

    const [newMain, newPreview] = await Promise.all([
      updateImage('MAIN', newImages?.mainImage, mainImage),
      updateImage('PREVIEW', newImages?.previewImage, previewImage),
    ]);

    if (ingredients) {
      data.ingredients = {
        deleteMany: {},
        create: ingredients.map((ing) => ({
          name: ing.name,
          amount: ing.amount,
          unit: ing.unit,
        })),
      };
    }

    if (newMain || newPreview) {
      const typesToDelete = [newMain && 'MAIN', newPreview && 'PREVIEW'].filter(
        Boolean,
      ) as ('MAIN' | 'PREVIEW')[];

      data.images = {
        deleteMany: { type: { in: typesToDelete } },
        create: [
          newMain && {
            imageUrl: newMain.imageUrl,
            publicId: newMain.publicId,
            type: 'MAIN',
          },
          newPreview && {
            imageUrl: newPreview.imageUrl,
            publicId: newPreview.publicId,
            type: 'PREVIEW',
          },
        ].filter(
          (
            img,
          ): img is {
            imageUrl: string;
            publicId: string;
            type: 'MAIN' | 'PREVIEW';
          } => Boolean(img),
        ),
      };
    }

    return this.prisma.recipe.update({
      data,
      where: { id },
    });
  }

  setRating(userId: string, recipeId: string, rating: number) {
    return this.recipeInteractionsFacade.setRating(userId, recipeId, rating);
  }

  async deleteRecipe(where: Prisma.RecipeWhereUniqueInput): Promise<Recipe> {
    return this.prisma.recipe.delete({
      where,
    });
  }
}
