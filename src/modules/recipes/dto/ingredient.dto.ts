import { IsString, IsNotEmpty } from 'class-validator';
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
    example: '0.5',
  })
  @IsString()
  @IsNotEmpty({ message: 'Amount is required' })
  amount!: string;

  @ApiProperty({
    description: 'Unit of measurement',
    example: 'g',
  })
  @IsString()
  @IsNotEmpty({ message: 'Unit is required' })
  unit!: string;
}
