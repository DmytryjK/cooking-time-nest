import { BadRequestException, PipeTransform } from '@nestjs/common';

export interface RecipeImageFiles {
  mainImage?: Express.Multer.File[];
  previewImage?: Express.Multer.File[];
}

export class RecipeImageValidationPipe implements PipeTransform {
  transform(files: RecipeImageFiles) {
    if (!files.mainImage?.[0]) {
      throw new BadRequestException('mainImage is required');
    }
    if (!files.previewImage?.[0]) {
      throw new BadRequestException('previewImage is required');
    }
    return files;
  }
}
