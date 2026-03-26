/*
  Warnings:

  - You are about to drop the `_FavoriteRecipes` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_FavoriteRecipes" DROP CONSTRAINT "_FavoriteRecipes_A_fkey";

-- DropForeignKey
ALTER TABLE "_FavoriteRecipes" DROP CONSTRAINT "_FavoriteRecipes_B_fkey";

-- DropTable
DROP TABLE "_FavoriteRecipes";

-- CreateTable
CREATE TABLE "FavoriteRecipe" (
    "userId" INTEGER NOT NULL,
    "recipeId" INTEGER NOT NULL,

    CONSTRAINT "FavoriteRecipe_pkey" PRIMARY KEY ("userId","recipeId")
);

-- AddForeignKey
ALTER TABLE "FavoriteRecipe" ADD CONSTRAINT "FavoriteRecipe_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FavoriteRecipe" ADD CONSTRAINT "FavoriteRecipe_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;
