import { IsString, IsNotEmpty, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class IngredientDto {
  @ApiProperty({
    description: 'Ingredient name',
    example: 'Flour',
  })
  @IsString()
  @IsNotEmpty({ message: 'Ingredient name is required' })
  name!: string;

  @ApiProperty({
    description: 'Ingredient amount',
    example: 500,
    minimum: 0,
  })
  @IsNumber()
  @Min(0, { message: 'Amount must be a positive number' })
  amount!: string;

  @ApiProperty({
    description: 'Unit of measurement',
    example: 'g',
  })
  @IsString()
  @IsNotEmpty({ message: 'Unit is required' })
  unit!: string;
}
