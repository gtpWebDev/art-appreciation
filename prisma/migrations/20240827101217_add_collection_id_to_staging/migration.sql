/*
  Warnings:

  - Added the required column `fx_collection_id` to the `ListingStaging` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fx_collection_id` to the `PurchaseStaging` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ListingStaging" ADD COLUMN     "fx_collection_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "PurchaseStaging" ADD COLUMN     "fx_collection_id" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "Collection_fx_collection_id_idx" ON "Collection"("fx_collection_id");

-- CreateIndex
CREATE INDEX "ListingStaging_fx_collection_id_idx" ON "ListingStaging"("fx_collection_id");

-- CreateIndex
CREATE INDEX "PurchaseStaging_fx_collection_id_idx" ON "PurchaseStaging"("fx_collection_id");
