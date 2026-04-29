import { Recipe } from '@/generated/prisma/client';

export interface RecipeResponse extends Recipe {
  isFavorite?: boolean;
  userRating?: number | null;
}
