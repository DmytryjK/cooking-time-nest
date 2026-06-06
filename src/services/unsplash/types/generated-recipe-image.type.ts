export type GeneratedRecipeImageType = 'MAIN' | 'PREVIEW';

export interface GeneratedRecipeImage {
  id: string;
  imageUrl: string;
  publicId: string;
  type: GeneratedRecipeImageType;
  createdAt: Date;
}
