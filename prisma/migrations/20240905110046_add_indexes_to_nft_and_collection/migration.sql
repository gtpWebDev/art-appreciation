-- CreateIndex
CREATE INDEX "Collection_name_idx" ON "Collection"("name");

-- CreateIndex
CREATE INDEX "Collection_artist_id_idx" ON "Collection"("artist_id");

-- CreateIndex
CREATE INDEX "Nft_collection_id_idx" ON "Nft"("collection_id");
