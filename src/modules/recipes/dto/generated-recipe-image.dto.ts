import { ApiProperty } from '@nestjs/swagger';

export class GeneratedRecipeImageDto {
  @ApiProperty({
    description: 'Image URL (Unsplash)',
    example: 'https://images.unsplash.com/photo-123?w=1080',
  })
  imageUrl!: string;

  @ApiProperty({
    description: 'Unsplash photo id',
    example: 'abc123',
  })
  publicId!: string;

  @ApiProperty({
    description: 'Image type',
    enum: ['MAIN', 'PREVIEW'],
    example: 'MAIN',
  })
  type!: 'MAIN' | 'PREVIEW';
}
