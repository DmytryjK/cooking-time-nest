import { Module } from '@nestjs/common';
import { RecipesController } from './recipe.controller';
import { RecipesService } from './recipe.service';
import { CloudinaryModule } from '@/services/cloudinary/cloudinary.module';
import { RecipeInteractionsModule } from '../recipe-interactions/recipe-interactions.module';

@Module({
  imports: [CloudinaryModule, RecipeInteractionsModule],
  controllers: [RecipesController],
  providers: [RecipesService],
  exports: [RecipesService],
})
export class RecipesModule {}
