import { PrismaService } from '@/database/prisma';
import { Injectable } from '@nestjs/common';

@Injectable()
export class RecentlyViewedService {
  constructor(private prisma: PrismaService) {}
  async add(userId: string, recipeId: string, limit: number = 20) {
    const updatedViewed = await this.prisma.recentlyViewedRecipe.upsert({
      where: {
        userId_recipeId: { userId, recipeId },
      },
      update: {
        viewedAt: new Date(),
      },
      create: {
        userId,
        recipeId,
        viewedAt: new Date(),
      },
    });
    const count = await this.prisma.recentlyViewedRecipe.count({
      where: { userId },
    });
    if (count > limit) {
      const oldest = await this.prisma.recentlyViewedRecipe.findFirst({
        where: { userId },
        orderBy: { viewedAt: 'asc' },
      });

      if (!oldest) return;

      await this.prisma.recentlyViewedRecipe.delete({
        where: {
          userId_recipeId: {
            userId: oldest.userId,
            recipeId: oldest.recipeId,
          },
        },
      });
    }

    return updatedViewed;
  }

  delete(userId: string, recipeId: string) {
    return this.prisma.recentlyViewedRecipe.delete({
      where: {
        userId_recipeId: { userId, recipeId },
      },
    });
  }
}
