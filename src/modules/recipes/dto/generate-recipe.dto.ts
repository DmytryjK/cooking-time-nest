import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GenerateRecipeDto {
  @ApiProperty({
    description: 'Recipe video link',
    example:
      'https://www.tiktok.com/@vonavino/video/7571940435745066251?_r=1&_t=ZS-96lRZNIrlIb',
    required: true,
  })
  @IsString()
  @IsNotEmpty({ message: 'Url is required' })
  url: string;
}
