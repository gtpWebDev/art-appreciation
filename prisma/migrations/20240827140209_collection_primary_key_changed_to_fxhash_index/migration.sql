/*
  Warnings:

  - You are about to drop the column `fx_collection_id` on the `Collection` table. All the data in the column will be lost.
  - You are about to drop the column `fx_collection_id` on the `ListingStaging` table. All the data in the column will be lost.
  - You are about to drop the column `fx_collection_id` on the `PurchaseStaging` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[id]` on the table `Collection` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `collection_id` to the `ListingStaging` table without a default value. This is not possible if the table is not empty.
  - Added the required column `collection_id` to the `PurchaseStaging` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Collection_fx_collection_id_idx";

-- DropIndex
DROP INDEX "Collection_fx_collection_id_key";

-- DropIndex
DROP INDEX "ListingStaging_fx_collection_id_idx";

-- DropIndex
DROP INDEX "PurchaseStaging_fx_collection_id_idx";

-- AlterTable
ALTER TABLE "Collection" DROP COLUMN "fx_collection_id",
ALTER COLUMN "id" DROP DEFAULT;
DROP SEQUENCE "Collection_id_seq";

-- AlterTable
ALTER TABLE "ListingStaging" DROP COLUMN "fx_collection_id",
ADD COLUMN     "collection_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "PurchaseStaging" DROP COLUMN "fx_collection_id",
ADD COLUMN     "collection_id" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Collection_id_key" ON "Collection"("id");

-- CreateIndex
CREATE INDEX "ListingStaging_collection_id_idx" ON "ListingStaging"("collection_id");

-- CreateIndex
CREATE INDEX "PurchaseStaging_collection_id_idx" ON "PurchaseStaging"("collection_id");
