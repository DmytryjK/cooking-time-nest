import { PrismaService } from '@/database/prisma';
import { Injectable } from '@nestjs/common';

@Injectable()
export class RatingService {
  constructor(private prisma: PrismaService) {}

  async setRating(userId: string, recipeId: string, rating: number) {
    const [, agg] = await this.prisma.$transaction([
      this.prisma.recipeRating.upsert({
        where: { userId_recipeId: { userId, recipeId } },
        create: { userId, recipeId, rating },
        update: { rating },
      }),
      this.prisma.recipeRating.aggregate({
        where: { recipeId },
        _avg: { rating: true },
        _count: true,
      }),
    ]);

    const updatedData = await this.prisma.recipe.update({
      where: { id: recipeId },
      data: {
        avgRating: Math.round((agg._avg.rating ?? 0) * 10) / 10,
        ratingsCount: agg._count,
      },
    });

    return {
      avgRating: updatedData.avgRating,
      ratingsCount: updatedData.ratingsCount,
      recipeId: updatedData.id,
      userRating: rating,
    };
  }
}
