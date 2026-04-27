import { IsBoolean, IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ToggleFavoriteDto {
  @ApiProperty({
    description: 'Recipe ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  @IsNotEmpty()
  recipeId!: string;

  @ApiProperty({
    description: 'Add to favorites if true, remove if false',
    example: true,
  })
  @IsBoolean()
  @IsNotEmpty()
  isFavorite!: boolean;
}
