/*
  Warnings:

  - You are about to drop the column `favoriteRecipeIds` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `recentlyRecipeViewedIds` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "favoriteRecipeIds",
DROP COLUMN "recentlyRecipeViewedIds";
