/*
  Warnings:

  - You are about to drop the column `release_month` on the `Nft` table. All the data in the column will be lost.
  - You are about to drop the column `release_year` on the `Nft` table. All the data in the column will be lost.
  - Added the required column `mint_month` to the `Nft` table without a default value. This is not possible if the table is not empty.
  - Added the required column `mint_year` to the `Nft` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Nft_release_year_release_month_idx";

-- AlterTable
ALTER TABLE "Nft" DROP COLUMN "release_month",
DROP COLUMN "release_year",
ADD COLUMN     "mint_month" INTEGER NOT NULL,
ADD COLUMN     "mint_year" INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX "Nft_mint_year_mint_month_idx" ON "Nft"("mint_year", "mint_month");
