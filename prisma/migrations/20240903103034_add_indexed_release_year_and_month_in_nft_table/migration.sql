/*
  Warnings:

  - Added the required column `release_month` to the `Nft` table without a default value. This is not possible if the table is not empty.
  - Added the required column `release_year` to the `Nft` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Nft" ADD COLUMN     "release_month" INTEGER NOT NULL,
ADD COLUMN     "release_year" INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX "Nft_release_year_release_month_idx" ON "Nft"("release_year", "release_month");
