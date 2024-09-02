/*
  Warnings:

  - You are about to drop the `ListingStaging` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PurchaseStaging` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "ListingStaging";

-- DropTable
DROP TABLE "PurchaseStaging";

-- CreateTable
CREATE TABLE "TransactionStaging" (
    "id" SERIAL NOT NULL,
    "transaction_type" TEXT NOT NULL,
    "fx_nft_id" TEXT NOT NULL,
    "collection_id" INTEGER NOT NULL,
    "raw_account_id" TEXT NOT NULL,
    "price_tz" DECIMAL(65,30),
    "timestamp" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TransactionStaging_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TransactionStaging_fx_nft_id_idx" ON "TransactionStaging"("fx_nft_id");

-- CreateIndex
CREATE INDEX "TransactionStaging_collection_id_idx" ON "TransactionStaging"("collection_id");

-- CreateIndex
CREATE INDEX "TransactionStaging_raw_account_id_idx" ON "TransactionStaging"("raw_account_id");
