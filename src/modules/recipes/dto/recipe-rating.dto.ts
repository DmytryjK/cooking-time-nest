import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Max, Min } from 'class-validator';

export class RecipeRatingDto {
  @ApiProperty({
    description: 'Search by title and description',
    example: 'pizza',
  })
  @IsNumber()
  @Min(0, { message: 'Рейтинг не може бути менше 0' })
  @Max(5, { message: 'Рейтинг не може бути більше 5' })
  rating!: number;
}

export class RecipeRatingResponseDto {
  @ApiProperty({ example: 4.5 })
  avgRating!: number;

  @ApiProperty({ example: 23 })
  ratingsCount!: number;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  recipeId!: string;

  @ApiProperty({
    description: 'Rating for recipe from current user',
    example: 3.5,
  })
  userRating!: number;
}
