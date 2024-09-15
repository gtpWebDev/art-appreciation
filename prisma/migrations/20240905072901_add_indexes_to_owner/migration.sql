-- CreateIndex
CREATE INDEX "Purchase_account_id_idx" ON "Purchase"("account_id");

-- CreateIndex
CREATE INDEX "TzAccount_owner_id_idx" ON "TzAccount"("owner_id");

-- CreateIndex
CREATE INDEX "TzAccountOwner_parent_address_idx" ON "TzAccountOwner"("parent_address");
