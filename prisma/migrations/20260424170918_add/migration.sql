-- AlterTable
ALTER TABLE "User" ADD COLUMN     "recentlyRecipeViewedIds" TEXT[] DEFAULT ARRAY[]::TEXT[];
