import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsUUID,
  ValidateNested,
  ArrayMinSize,
  IsNumber,
  IsUrl,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty, getSchemaPath } from '@nestjs/swagger';
import { IngredientDto } from './ingredient.dto';

export class CreateRecipeDto {
  @ApiProperty({
    description: 'Recipe title',
    example: 'Margherita Pizza',
  })
  @IsString()
  @IsNotEmpty({ message: 'Title is required' })
  title!: string;

  @ApiProperty({
    description: 'Recipe description',
    example: 'Classic Italian pizza with tomatoes and mozzarella',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Category ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  @IsNotEmpty()
  categoryId!: string;

  @ApiProperty({
    description: 'Cooking time in minutes',
    example: 30,
  })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  cookingTimeInMinutes!: number;

  @ApiProperty({
    description: 'List of ingredients',
    type: 'array',
    items: { $ref: getSchemaPath(IngredientDto) },
    example: [
      { name: 'Flour', amount: '500', unit: 'g' },
      { name: 'Water', amount: '300', unit: 'ml' },
    ],
  })
  @Transform(({ value }) => {
    try {
      const parsed = typeof value === 'string' ? JSON.parse(value) : value;
      const data = parsed.map((item: any) =>
        Object.assign(new IngredientDto(), item),
      );
      return data;
    } catch {
      return value;
    }
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => IngredientDto)
  ingredients!: IngredientDto[];

  @ApiProperty({
    description: 'Main image URL (use instead of mainImage file upload)',
    example: 'https://images.unsplash.com/photo-1633337474564-1d9478ca4e2e?w=1080',
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsUrl({ protocols: ['http', 'https'], require_tld: false })
  mainImage?: string;

  @ApiProperty({
    description: 'Preview image URL (use instead of previewImage file upload)',
    example: 'https://images.unsplash.com/photo-1588013273468-315fd88ea34c?w=400',
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsUrl({ protocols: ['http', 'https'], require_tld: false })
  previewImage?: string;
}
