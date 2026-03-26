import { ApiProperty } from '@nestjs/swagger';

class IngredientResponseDto {
  @ApiProperty({
    description: 'Ingredient name',
    example: 'Flour',
  })
  name: string;

  @ApiProperty({
    description: 'Ingredient amount',
    example: 500,
  })
  amount: number;

  @ApiProperty({
    description: 'Unit of measurement',
    example: 'g',
  })
  unit: string;
}

export class RecipeResponseDto {
  @ApiProperty({
    description: 'Recipe ID',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Recipe title',
    example: 'Margherita Pizza',
  })
  title: string;

  @ApiProperty({
    description: 'Recipe description',
    example: 'Classic Italian pizza with tomatoes and mozzarella',
    nullable: true,
  })
  description: string | null;

  @ApiProperty({
    description: 'List of ingredients',
    type: [IngredientResponseDto],
    example: [
      { name: 'Flour', amount: 500, unit: 'g' },
      { name: 'Water', amount: 300, unit: 'ml' },
      { name: 'Yeast', amount: 7, unit: 'g' },
    ],
  })
  ingredients: IngredientResponseDto[];

  @ApiProperty({
    description: 'Author ID',
    example: 1,
    nullable: true,
  })
  authorId: number | null;

  @ApiProperty({
    description: 'Creation date',
    example: '2024-01-15T10:30:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update date',
    example: '2024-01-15T10:30:00.000Z',
  })
  updatedAt: Date;
}

export class RecipeListResponseDto {
  @ApiProperty({
    description: 'List of recipes',
    type: [RecipeResponseDto],
    isArray: true,
  })
  recipes: RecipeResponseDto[];
}
