-- CreateEnum
CREATE TYPE "VideoRecipeParseStatus" AS ENUM ('SUCCESS', 'NOT_A_RECIPE', 'EXTRACT_FAILED');

-- CreateTable
CREATE TABLE "VideoRecipeParse" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "platformVideoId" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "normalizedUrl" TEXT NOT NULL,
    "status" "VideoRecipeParseStatus" NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "cookingTimeInMinutes" INTEGER,
    "ingredients" JSONB,
    "suggestedCategoryName" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VideoRecipeParse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VideoRecipeParse_userId_normalizedUrl_idx" ON "VideoRecipeParse"("userId", "normalizedUrl");

-- CreateIndex
CREATE UNIQUE INDEX "VideoRecipeParse_userId_platformVideoId_key" ON "VideoRecipeParse"("userId", "platformVideoId");

-- AddForeignKey
ALTER TABLE "VideoRecipeParse" ADD CONSTRAINT "VideoRecipeParse_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
