import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class RecipeLlmIngredientDto {
  @ApiProperty({ description: 'Ingredient name', example: 'борошно' })
  name!: string;

  @ApiProperty({
    description: 'Numeric quantity (e.g. "200", "1/2") or "-" if not specified',
    example: '500',
  })
  amount!: string;

  @ApiProperty({ description: 'Unit of measurement', example: 'гр' })
  unit!: string;
}

export class RecipeLlmParseResultDto {
  @ApiProperty({
    description: 'Whether the video contains a recipe',
    example: true,
  })
  isRecipe!: boolean;

  @ApiPropertyOptional({
    description: 'Recipe title',
    example: 'Борщ український',
  })
  title?: string;

  @ApiPropertyOptional({
    description:
      'Step-by-step instructions as HTML (react-quill: p, strong, br)',
    example: '<p>Зварити бульйон...</p>',
  })
  description?: string;

  @ApiPropertyOptional({
    description: 'Cooking time in minutes',
    example: 90,
  })
  cookingTimeInMinutes?: number;

  @ApiPropertyOptional({
    description: 'List of ingredients',
    type: [RecipeLlmIngredientDto],
  })
  @Type(() => RecipeLlmIngredientDto)
  ingredients?: RecipeLlmIngredientDto[];

  @ApiPropertyOptional({
    description: 'Suggested category name from LLM',
    example: 'Супи',
  })
  suggestedCategoryName?: string;

  @ApiPropertyOptional({
    description: 'English search query for recipe stock photos',
    example: 'ukrainian borscht soup food',
  })
  imageSearchQuery?: string;
}
