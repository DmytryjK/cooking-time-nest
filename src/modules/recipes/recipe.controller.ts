import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { SerializeOptions } from '@nestjs/common';
import { RecipesService } from './recipe.service';
import { Recipe } from '@/generated/prisma/client';
import { JwtAuthGuard, OptionalJwtAuthGuard } from '@/modules/auth/guards';
import { RecipeAccessGuard } from './guards';
import { CurrentUser } from '@/modules/auth/decorators';
import {
  CreateRecipeDto,
  UpdateRecipeDto,
  RecipeResponseDto,
  GetRecipesQueryDto,
  GenerateRecipeDto,
  GenerateRecipeResponseDto,
} from './dto';
import type { UserModel } from '@/generated/prisma/models';
import {
  ErrorResponseDto,
  UnauthorizedResponseDto,
  ForbiddenResponseDto,
  NotFoundResponseDto,
} from '@/common/dto';
import {
  type RecipeImageFiles,
  RecipeImageValidationPipe,
} from './pipes/recipe-images-validation.pipe';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { RecipeResponse } from './types/recipe-response.type';
import {
  RecipeRatingDto,
  RecipeRatingResponseDto,
} from './dto/recipe-rating.dto';

@ApiTags('Recipes')
@Controller('recipes')
export class RecipesController {
  constructor(private readonly recipeService: RecipesService) {}

  @Get('favorites')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @SerializeOptions({ type: RecipeResponseDto })
  @ApiOperation({
    summary: 'Get all favorite recipes',
    description: 'Retrieve all favorite recipes for authorized user.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of recipes',
    type: [RecipeResponseDto],
  })
  getAllFavoriteRecipes(@CurrentUser() user: UserModel): Promise<Recipe[]> {
    return this.recipeService.favoriteRecipes(user);
  }

  @Post('generate-recipe-from-video-url')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Generate recipe from video url',
    description: 'Generate recipe from video url',
  })
  @ApiBody({ type: GenerateRecipeDto })
  @ApiResponse({
    status: 200,
    description: 'Recipe generated',
    type: GenerateRecipeResponseDto,
  })
  testLlm(@Body() { url }: GenerateRecipeDto, @CurrentUser() user: UserModel) {
    return this.recipeService.generateRecipeFromVideoUrl(url, user);
  }

  @Get('recently-viewed-recipes')
  @UseGuards(JwtAuthGuard)
  @SerializeOptions({ type: RecipeResponseDto })
  @ApiOperation({
    summary: 'Get recently viewed recipes for user',
    description: '',
  })
  @ApiResponse({
    status: 200,
    description: 'Recipes found',
    type: RecipeResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Recipes not found',
    type: NotFoundResponseDto,
  })
  getRecentlyViewedRecipes(
    @CurrentUser() user: UserModel,
  ): Promise<RecipeResponse[]> {
    return this.recipeService.recentlyViewedRecipes(user);
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  @SerializeOptions({ type: RecipeResponseDto })
  @ApiOperation({
    summary: 'Get recipe by ID',
    description: 'Retrieve a single recipe by its unique identifier',
  })
  @ApiParam({
    name: 'id',
    description: 'Recipe ID',
    type: String,
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Recipe found',
    type: RecipeResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Recipe not found',
    type: NotFoundResponseDto,
  })
  getRecipeById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user?: UserModel,
  ): Promise<RecipeResponse> {
    return this.recipeService.recipe(
      { id },
      { ingredients: true, category: true, images: true },
      user,
    );
  }

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  @SerializeOptions({ type: RecipeResponseDto })
  @ApiOperation({
    summary: 'Get all recipes with search capability',
    description:
      'Retrieve all recipes with optional search by title and description',
  })
  @ApiResponse({
    status: 200,
    description: 'List of recipes',
    type: [RecipeResponseDto],
  })
  getAllRecipes(
    @CurrentUser() user: UserModel | undefined,
    @Query() query: GetRecipesQueryDto,
  ): Promise<{totalCount: number, page: number, limit: number, recipes: RecipeResponse[]}> {
    return this.recipeService.recipes(query, user);
  }

  @Post('new')
  @UseGuards(OptionalJwtAuthGuard)
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'mainImage', maxCount: 1 },
      { name: 'previewImage', maxCount: 1 },
    ]),
  )
  @ApiBearerAuth('JWT-auth')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        mainImage: {
          oneOf: [{ type: 'string', format: 'binary' }, { type: 'string' }],
          description: 'Main image file or URL',
        },
        previewImage: {
          oneOf: [{ type: 'string', format: 'binary' }, { type: 'string' }],
          description: 'Preview image file or URL',
        },
      },
    },
  })
  @ApiOperation({
    summary: 'Create a new recipe',
    description:
      'Create a new recipe. Authentication is optional - if authenticated, recipe will be linked to user',
  })
  @ApiResponse({
    status: 201,
    description: 'Recipe successfully created',
    type: RecipeResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid data',
    type: ErrorResponseDto,
  })
  async createRecipe(
    @UploadedFiles(new RecipeImageValidationPipe())
    files: RecipeImageFiles,
    @Body()
    recipe: CreateRecipeDto,
    @CurrentUser() user?: UserModel,
  ): Promise<Recipe> {
    return this.recipeService.createRecipe({ files, recipe, user });
  }

  @Post(':id/rating')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Set recipe rating',
    description: 'Update recipe rating',
  })
  @ApiParam({
    name: 'id',
    description: 'Recipe ID',
    type: String,
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Rating updated',
    type: RecipeRatingResponseDto,
  })
  setRecipeRating(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser()
    user: UserModel,
    @Body()
    { rating }: RecipeRatingDto,
  ): Promise<RecipeRatingResponseDto> {
    return this.recipeService.setRating(user.id, id, rating);
  }

  @Put('update/:id')
  @UseGuards(OptionalJwtAuthGuard)
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'mainImage', maxCount: 1 },
      { name: 'previewImage', maxCount: 1 },
    ]),
  )
  @ApiBearerAuth('JWT-auth')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        mainImage: {
          oneOf: [{ type: 'string', format: 'binary' }, { type: 'string' }],
          description: 'Main image file or URL',
        },
        previewImage: {
          oneOf: [{ type: 'string', format: 'binary' }, { type: 'string' }],
          description: 'Preview image file or URL',
        },
      },
    },
  })
  @ApiOperation({
    summary: 'Update recipe',
    description: 'Update an existing recipe. Only recipe owner can update it',
  })
  @ApiParam({
    name: 'id',
    description: 'Recipe ID',
    type: String,
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Recipe successfully updated',
    type: RecipeResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid data',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: UnauthorizedResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'No permission to modify recipe',
    type: ForbiddenResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Recipe not found',
    type: NotFoundResponseDto,
  })
  updateRecipe(
    @Param('id', ParseUUIDPipe) id: string,
    @Body()
    updatedRecipe: UpdateRecipeDto,
    @UploadedFiles()
    newImages?: RecipeImageFiles,
  ): Promise<Recipe> {
    return this.recipeService.updateRecipe(id, updatedRecipe, newImages);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RecipeAccessGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Delete recipe',
    description: 'Delete an existing recipe. Only recipe owner can delete it',
  })
  @ApiParam({
    name: 'id',
    description: 'Recipe ID',
    type: String,
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Recipe successfully deleted',
    type: RecipeResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: UnauthorizedResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'No permission to delete recipe',
    type: ForbiddenResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Recipe not found',
    type: NotFoundResponseDto,
  })
  deleteRecipe(@Param('id', ParseUUIDPipe) id: string): Promise<Recipe> {
    return this.recipeService.deleteRecipe({ id });
  }
}
