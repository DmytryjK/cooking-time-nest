import { Module } from '@nestjs/common';
import { RecipeInteractionsFacade } from './recipe-interactions.facade';
import { FavoritesModule } from './favorites/favorites.module';
import { RecentlyViewedModule } from './recently-viewed/recently-viewed.module';

@Module({
  imports: [FavoritesModule, RecentlyViewedModule],
  providers: [RecipeInteractionsFacade],
  exports: [RecipeInteractionsFacade],
})
export class RecipeInteractionsModule {}
