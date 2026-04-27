import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class GetRecipesQueryDto {
  @ApiPropertyOptional({
    description: 'Search by title and description',
    example: 'pizza',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by ingredients (comma-separated)',
    example: 'flour,tomato',
  })
  @IsOptional()
  @IsString()
  ingredients?: string;

  @ApiPropertyOptional({
    description: 'Filter by categories (comma-separated)',
    example: 'deserts,salats',
  })
  @IsOptional()
  @IsString()
  categories?: string;
}
