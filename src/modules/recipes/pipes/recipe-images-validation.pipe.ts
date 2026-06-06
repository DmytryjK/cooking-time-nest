import { BadRequestException, PipeTransform } from '@nestjs/common';

export interface RecipeImageFiles {
  mainImage?: Express.Multer.File[];
  previewImage?: Express.Multer.File[];
}

/** Passes uploaded files through; image presence is validated in RecipesService. */
export class RecipeImageValidationPipe implements PipeTransform {
  transform(files: RecipeImageFiles | undefined) {
    return files ?? {};
  }
}

export function assertRecipeImageInput(
  files: RecipeImageFiles,
  mainImageUrl?: string,
  previewImageUrl?: string,
): void {
  const hasMainFile = Boolean(files.mainImage?.[0]);
  const hasPreviewFile = Boolean(files.previewImage?.[0]);
  const hasMainUrl = Boolean(mainImageUrl?.trim());
  const hasPreviewUrl = Boolean(previewImageUrl?.trim());

  if (hasMainFile && hasMainUrl) {
    throw new BadRequestException(
      'Provide mainImage either as a file or as a URL, not both',
    );
  }

  if (hasPreviewFile && hasPreviewUrl) {
    throw new BadRequestException(
      'Provide previewImage either as a file or as a URL, not both',
    );
  }

  if (!hasMainFile && !hasMainUrl) {
    throw new BadRequestException('mainImage is required (file or URL)');
  }

  if (!hasPreviewFile && !hasPreviewUrl) {
    throw new BadRequestException('previewImage is required (file or URL)');
  }
}

export interface ResolvedRecipeImage {
  imageUrl: string;
  publicId: string;
}

export function publicIdFromImageUrl(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    const unsplashMatch = pathname.match(/\/(photo-[^/]+)/);

    if (unsplashMatch) {
      return unsplashMatch[1];
    }

    return `external-${pathname.replace(/\//g, '-').slice(0, 120)}`;
  } catch {
    return `external-${Date.now()}`;
  }
}
