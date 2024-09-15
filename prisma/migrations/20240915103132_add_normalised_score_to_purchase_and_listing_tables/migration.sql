/*
  Warnings:

  - Added the required column `normalised_score` to the `Listing` table without a default value. This is not possible if the table is not empty.
  - Added the required column `normalised_score` to the `Purchase` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Listing" ADD COLUMN     "normalised_score" DECIMAL(65,30) NOT NULL;

-- AlterTable
ALTER TABLE "Purchase" ADD COLUMN     "normalised_score" DECIMAL(65,30) NOT NULL;
