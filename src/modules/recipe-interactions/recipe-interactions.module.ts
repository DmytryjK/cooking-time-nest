import { Module } from '@nestjs/common';
import { RecipeInteractionsFacade } from './recipe-interactions.facade';
import { FavoritesModule } from './favorites/favorites.module';
import { RecentlyViewedModule } from './recently-viewed/recently-viewed.module';
import { RatingModule } from './rating/rating.module';

@Module({
  imports: [FavoritesModule, RecentlyViewedModule, RatingModule],
  providers: [RecipeInteractionsFacade],
  exports: [RecipeInteractionsFacade],
})
export class RecipeInteractionsModule {}
