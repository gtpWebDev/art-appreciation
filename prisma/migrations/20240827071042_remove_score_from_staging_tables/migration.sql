/*
  Warnings:

  - You are about to drop the column `score` on the `ListingStaging` table. All the data in the column will be lost.
  - You are about to drop the column `score` on the `PurchaseStaging` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ListingStaging" DROP COLUMN "score";

-- AlterTable
ALTER TABLE "PurchaseStaging" DROP COLUMN "score";
