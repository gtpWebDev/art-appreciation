/*
  Warnings:

  - Added the required column `price_usd` to the `Purchase` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Purchase" ADD COLUMN     "price_usd" DECIMAL(65,30) NOT NULL;
