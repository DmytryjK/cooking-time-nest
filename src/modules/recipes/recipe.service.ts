import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma/prisma.service';
import { Recipe, Prisma } from '@/generated/prisma/client';
import { CreateRecipeDto, GetRecipesQueryDto } from './dto';
import { UserModel } from '@/generated/prisma/models';
import type { RecipeImageFiles } from './pipes/recipe-images-validation.pipe';
import { CloudinaryService } from '@/services/cloudinary';
import { RecipeResponse } from './types/recipe-response.type';
import { RecipeInteractionsFacade } from '../recipe-interactions/recipe-interactions.facade';

@Injectable()
export class RecipesService {
  constructor(
    private prisma: PrismaService,
    private cloudinaryService: CloudinaryService,
    private recipeInteractionsFacade: RecipeInteractionsFacade,
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
  private async uploadRecipeImages(files: RecipeImageFiles) {
    const [mainImageData, previewImageData] = await Promise.all([
      this.cloudinaryService.uploadImage(files.mainImage![0]),
      this.cloudinaryService.uploadImage(files.previewImage![0]),
    ]);

    return { mainImageData, previewImageData };
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

    return recipe;
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
    } = recipe;
    const authorId = user?.id;

    const { mainImageData, previewImageData } =
      await this.uploadRecipeImages(files);

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
              imageUrl: previewImageData.secure_url,
              publicId: previewImageData.public_id,
              type: 'PREVIEW',
            },
            {
              imageUrl: mainImageData.secure_url,
              publicId: mainImageData.public_id,
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
    { ingredients, ...fields }: Partial<CreateRecipeDto>,
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
    ) => {
      if (!newImage) return null;

      const current = currentRecipe.images.find((img) => img.type === type);
      const uploaded = await this.cloudinaryService.uploadImage(newImage[0]);
      if (current) await this.cloudinaryService.deleteImage(current.publicId);
      return uploaded;
    };

    const [newMain, newPreview] = await Promise.all([
      updateImage('MAIN', newImages?.mainImage),
      updateImage('PREVIEW', newImages?.previewImage),
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
            imageUrl: newMain.secure_url,
            publicId: newMain.public_id,
            type: 'MAIN',
          },
          newPreview && {
            imageUrl: newPreview.secure_url,
            publicId: newPreview.public_id,
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

  async deleteRecipe(where: Prisma.RecipeWhereUniqueInput): Promise<Recipe> {
    return this.prisma.recipe.delete({
      where,
    });
  }
}
