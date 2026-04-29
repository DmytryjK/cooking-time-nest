import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Type } from 'class-transformer';

class IngredientResponseDto {
  @Exclude()
  recipeId!: string;

  @ApiProperty({ description: 'Ingredient name', example: 'Flour' })
  name!: string;

  @ApiProperty({ description: 'Ingredient amount', example: 500 })
  amount!: number;

  @ApiProperty({ description: 'Unit of measurement', example: 'g' })
  unit!: string;
}

class CategoryResponseDto {
  @ApiProperty({ description: 'Category ID', example: 'uuid' })
  id!: string;

  @ApiProperty({ description: 'Category name', example: 'Italian' })
  name!: string;
}

export class RecipeResponseDto {
  @ApiProperty({ description: 'Recipe ID', example: 'uuid' })
  id!: string;

  @ApiProperty({ description: 'Recipe title', example: 'Margherita Pizza' })
  title!: string;

  @ApiProperty({
    description: 'Recipe description',
    example: 'Classic Italian pizza with tomatoes and mozzarella',
    nullable: true,
  })
  description!: string | null;

  @ApiProperty({
    description: 'List of ingredients',
    type: [IngredientResponseDto],
  })
  @Type(() => IngredientResponseDto)
  ingredients!: IngredientResponseDto[];

  @Exclude()
  categoryId!: string;

  @ApiProperty({ description: 'Recipe category', type: CategoryResponseDto })
  @Type(() => CategoryResponseDto)
  category!: CategoryResponseDto;

  @ApiProperty({ description: 'Author ID', example: 'uuid', nullable: true })
  userId!: string | null;

  @ApiProperty({
    description: 'Cooking time in minutes',
    example: 120,
    nullable: false,
  })
  cookingTimeInMinutes!: number;

  @ApiProperty({ description: 'Is recipe in favorites', example: false })
  isFavorite!: boolean;

  @ApiProperty({
    description: 'Rating for recipe from current user',
    example: 3.5,
  })
  userRating?: number;

  @ApiProperty({
    description: 'Creation date',
    example: '2024-01-15T10:30:00.000Z',
  })
  createdAt!: Date;

  @ApiProperty({
    description: 'Last update date',
    example: '2024-01-15T10:30:00.000Z',
  })
  updatedAt!: Date;
}

export class RecipeListResponseDto {
  @ApiProperty({
    description: 'List of recipes',
    type: [RecipeResponseDto],
    isArray: true,
  })
  recipes!: RecipeResponseDto[];
}
