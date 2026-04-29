import { Injectable } from '@nestjs/common';
import { FavoritesService } from './favorites/favorites.service';
import { RecentlyViewedService } from './recently-viewed/recently-viewed.service';
import { RatingService } from './rating/rating.service';

@Injectable()
export class RecipeInteractionsFacade {
  constructor(
    private readonly favoritesService: FavoritesService,
    private readonly recentlyViewedService: RecentlyViewedService,
    private readonly ratingService: RatingService,
  ) {}

  async addRecentlyViewedRecipe(userId: string, recipeId: string) {
    await this.recentlyViewedService.add(userId, recipeId);
  }

  toggleFavorites(userId: string, recipeId: string) {
    return this.favoritesService.toggle(userId, recipeId);
  }

  setRating(userId: string, recipeId: string, rating: number) {
    return this.ratingService.setRating(userId, recipeId, rating);
  }

  // async removeFromFavorites(userId: string, recipeId: string) {
  //   return this.favoritesService.remove(userId, recipeId);
  // }

  // async toggleLike(userId: string, recipeId: string) {
  //   return this.likesService.toggle(userId, recipeId);
  // }
}
