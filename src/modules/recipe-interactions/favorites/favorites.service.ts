import { PrismaService } from '@/database/prisma';
import { Injectable } from '@nestjs/common';

@Injectable()
export class FavoritesService {
  constructor(private prisma: PrismaService) {}

  async toggle(userId: string, recipeId: string) {
    try {
      await this.prisma.favoriteRecipe.create({
        data: { userId, recipeId },
      });

      return { isFavorite: true };
    } catch {
      await this.prisma.favoriteRecipe.delete({
        where: {
          userId_recipeId: { userId, recipeId },
        },
      });

      return { isFavorite: false };
    }
  }
}
