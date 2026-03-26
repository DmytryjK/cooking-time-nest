import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { RecipesService } from './recipe.service';
import { Recipe } from '@/generated/prisma/client';
import { OptionalJwtAuthGuard } from '@/modules/auth/guards';
import { RecipeOwnershipGuard } from './guards';
import { CurrentUser } from '@/modules/auth/decorators';
import { CreateRecipeDto, UpdateRecipeDto, RecipeResponseDto } from './dto';
import { UserModel } from '@/generated/prisma/models';
import {
  ErrorResponseDto,
  UnauthorizedResponseDto,
  ForbiddenResponseDto,
  NotFoundResponseDto,
} from '@/common/dto';

@ApiTags('Recipes')
@Controller('recipes')
export class RecipesController {
  constructor(private readonly recipeService: RecipesService) {}

  @Get(':id')
  @ApiOperation({
    summary: 'Get recipe by ID',
    description: 'Retrieve a single recipe by its unique identifier',
  })
  @ApiParam({
    name: 'id',
    description: 'Recipe ID',
    type: String,
    example: '1',
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
  getRecipeById(@Param('id', ParseIntPipe) id: number): Promise<Recipe | null> {
    return this.recipeService.recipe({ id });
  }

  @Get()
  @ApiOperation({
    summary: 'Get all recipes with search capability',
    description:
      'Retrieve all recipes with optional search by title and description',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search by title and description',
    type: String,
    example: 'pizza',
  })
  @ApiQuery({
    name: 'ingredients',
    required: false,
    description: 'Filter by ingredients',
    type: String,
    example: 'flour',
  })
  @ApiResponse({
    status: 200,
    description: 'List of recipes',
    type: [RecipeResponseDto],
  })
  getAllRecipes(
    @Query('search') search?: string,
    @Query('ingredients') ingredients?: string,
  ): Promise<Recipe[]> {
    const where: any = {};

    // Поиск по названию рецепта
    if (search) {
      where.title = { contains: search, mode: 'insensitive' };
    }

    // Поиск по ингредиентам (OR - хотя бы один подходит)
    if (ingredients) {
      const ingredientList = ingredients.split(',').map((i) => i.trim());

      where.OR = ingredientList.map((ing) => ({
        ingredients: {
          some: {
            name: { contains: ing, mode: 'insensitive' },
          },
        },
      }));
    }

    return this.recipeService.recipes({
      where,
    });
  }

  @Post()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
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
  createRecipe(
    @Body() createRecipeDto: CreateRecipeDto,
    @CurrentUser() user: UserModel | undefined,
  ): Promise<Recipe> {
    const { title, description, ingredients } = createRecipeDto;
    const authorId = user?.id;

    return this.recipeService.createRecipe({
      title,
      description,
      ingredients: {
        create: ingredients.map((ing) => ({
          name: ing.name,
          amount: ing.amount,
          unit: ing.unit,
        })),
      },
      ...(authorId && {
        user: {
          connect: { id: authorId },
        },
      }),
    });
  }

  @Put(':id')
  @UseGuards(OptionalJwtAuthGuard, RecipeOwnershipGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Update recipe',
    description: 'Update an existing recipe. Only recipe owner can update it',
  })
  @ApiParam({
    name: 'id',
    description: 'Recipe ID',
    type: String,
    example: '1',
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
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRecipeDto: UpdateRecipeDto,
  ): Promise<Recipe> {
    const { title, description, ingredients } = updateRecipeDto;

    return this.recipeService.updateRecipe({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(ingredients && {
          ingredients: {
            deleteMany: {}, // Удаляем старые ингредиенты
            create: ingredients.map((ing) => ({
              name: ing.name,
              amount: ing.amount,
              unit: ing.unit,
            })),
          },
        }),
      },
    });
  }

  @Delete(':id')
  @UseGuards(OptionalJwtAuthGuard, RecipeOwnershipGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Delete recipe',
    description: 'Delete an existing recipe. Only recipe owner can delete it',
  })
  @ApiParam({
    name: 'id',
    description: 'Recipe ID',
    type: String,
    example: '1',
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
  deleteRecipe(@Param('id', ParseIntPipe) id: number): Promise<Recipe> {
    return this.recipeService.deleteRecipe({ id });
  }
}
