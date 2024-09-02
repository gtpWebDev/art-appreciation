-- CreateIndex
CREATE INDEX "Purchase_nft_id_idx" ON "Purchase"("nft_id");

-- CreateIndex
CREATE INDEX "Purchase_transaction_type_idx" ON "Purchase"("transaction_type");

-- CreateIndex
CREATE INDEX "TransactionStaging_timestamp_idx" ON "TransactionStaging"("timestamp");
