import { Module } from '@nestjs/common';
import { RecipesController } from './recipe.controller';
import { RecipesService } from './recipe.service';

@Module({
  controllers: [RecipesController],
  providers: [RecipesService],
  exports: [RecipesService],
})
export class RecipesModule {}
