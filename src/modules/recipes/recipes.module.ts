import { Module } from '@nestjs/common';
import { RecipesController } from './recipe.controller';
import { RecipesService } from './recipe.service';
import { CloudinaryModule } from '@/services/cloudinary/cloudinary.module';
import { YtdlpModule } from '@/services/ytdlp';
import { OpenAiModule } from '@/services/openai';
import { UnsplashModule } from '@/services/unsplash';
import { RecipeInteractionsModule } from '../recipe-interactions/recipe-interactions.module';

@Module({
  imports: [
    CloudinaryModule,
    RecipeInteractionsModule,
    YtdlpModule,
    OpenAiModule,
    UnsplashModule,
  ],
  controllers: [RecipesController],
  providers: [RecipesService],
  exports: [RecipesService],
})
export class RecipesModule {}
