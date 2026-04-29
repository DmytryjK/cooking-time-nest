-- CreateTable
CREATE TABLE "RecipeRating" (
    "recipeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,

    CONSTRAINT "RecipeRating_pkey" PRIMARY KEY ("userId","recipeId")
);

-- AddForeignKey
ALTER TABLE "RecipeRating" ADD CONSTRAINT "RecipeRating_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeRating" ADD CONSTRAINT "RecipeRating_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
