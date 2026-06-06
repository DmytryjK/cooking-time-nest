import { GeneratedRecipeImage } from '@/services/unsplash';

export interface RecipeLlmIngredient {
  name: string;
  amount: string;
  unit: string;
}

export interface RecipeLlmParseResult {
  isRecipe: boolean;
  title?: string;
  description?: string;
  cookingTimeInMinutes?: number;
  ingredients?: RecipeLlmIngredient[];
  suggestedCategoryName?: string;
  imageSearchQuery?: string;
  images?: GeneratedRecipeImage[];
}
