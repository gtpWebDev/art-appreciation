/*
  Warnings:

  - Changed the type of `collection_id` on the `ListingStaging` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `collection_id` on the `PurchaseStaging` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "ListingStaging" DROP COLUMN "collection_id",
ADD COLUMN     "collection_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "PurchaseStaging" DROP COLUMN "collection_id",
ADD COLUMN     "collection_id" INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX "ListingStaging_collection_id_idx" ON "ListingStaging"("collection_id");

-- CreateIndex
CREATE INDEX "PurchaseStaging_collection_id_idx" ON "PurchaseStaging"("collection_id");
