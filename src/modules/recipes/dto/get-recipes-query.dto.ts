import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, IsPositive, IsInt } from 'class-validator';

export class GetRecipesQueryDto {
  
  @ApiProperty({
    description: 'Page for recipes pagination, must be greater 0',
    example: 1,
  })
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  page!: number;

  @ApiPropertyOptional({
    description: 'Limit recipes per page, default - 10',
    example: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  limit?: number;

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
