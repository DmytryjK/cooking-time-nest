import { ApiProperty } from '@nestjs/swagger';
import { RecipeLlmParseResultDto } from '@/services/openai/dto';
import { GeneratedRecipeImageDto } from './generated-recipe-image.dto';

export class GenerateRecipeResponseDto {
  @ApiProperty({ type: () => RecipeLlmParseResultDto })
  recipe!: RecipeLlmParseResultDto;

  @ApiProperty({
    description: 'Recipe images from Unsplash (preview + main)',
    type: [GeneratedRecipeImageDto],
  })
  images!: GeneratedRecipeImageDto[];
}
