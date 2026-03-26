import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IngredientDto } from './ingredient.dto';

export class CreateRecipeDto {
  @ApiProperty({
    description: 'Recipe title',
    example: 'Margherita Pizza',
  })
  @IsString()
  @IsNotEmpty({ message: 'Title is required' })
  title: string;

  @ApiProperty({
    description: 'Recipe description',
    example: 'Classic Italian pizza with tomatoes and mozzarella',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'List of ingredients',
    type: [IngredientDto],
    isArray: true,
    minItems: 1,
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'Recipe must have at least one ingredient' })
  @ValidateNested({ each: true })
  @Type(() => IngredientDto)
  ingredients: IngredientDto[];
}
