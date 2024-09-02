-- CreateTable
CREATE TABLE "TransactionStagingTemp" (
    "id" SERIAL NOT NULL,
    "transaction_type" TEXT NOT NULL,
    "fx_nft_id" TEXT NOT NULL,
    "collection_id" INTEGER NOT NULL,
    "raw_account_id" TEXT NOT NULL,
    "price_tz" DECIMAL(65,30),
    "timestamp" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TransactionStagingTemp_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TransactionStagingTemp_fx_nft_id_idx" ON "TransactionStagingTemp"("fx_nft_id");

-- CreateIndex
CREATE INDEX "TransactionStagingTemp_collection_id_idx" ON "TransactionStagingTemp"("collection_id");

-- CreateIndex
CREATE INDEX "TransactionStagingTemp_raw_account_id_idx" ON "TransactionStagingTemp"("raw_account_id");

-- CreateIndex
CREATE INDEX "TransactionStagingTemp_timestamp_idx" ON "TransactionStagingTemp"("timestamp");
