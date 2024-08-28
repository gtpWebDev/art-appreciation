/*
  Warnings:

  - You are about to drop the column `accountId` on the `ListingStaging` table. All the data in the column will be lost.
  - You are about to drop the column `nftId` on the `ListingStaging` table. All the data in the column will be lost.
  - You are about to drop the column `accountId` on the `PurchaseStaging` table. All the data in the column will be lost.
  - Added the required column `fxNftId` to the `ListingStaging` table without a default value. This is not possible if the table is not empty.
  - Added the required column `rawAccountId` to the `ListingStaging` table without a default value. This is not possible if the table is not empty.
  - Added the required column `rawAccountId` to the `PurchaseStaging` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "PurchaseStaging" DROP CONSTRAINT "PurchaseStaging_fxNftId_fkey";

-- AlterTable
ALTER TABLE "ListingStaging" DROP COLUMN "accountId",
DROP COLUMN "nftId",
ADD COLUMN     "fxNftId" TEXT NOT NULL,
ADD COLUMN     "rawAccountId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "PurchaseStaging" DROP COLUMN "accountId",
ADD COLUMN     "rawAccountId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "ListingStaging_fxNftId_idx" ON "ListingStaging"("fxNftId");

-- CreateIndex
CREATE INDEX "ListingStaging_rawAccountId_idx" ON "ListingStaging"("rawAccountId");

-- CreateIndex
CREATE INDEX "Nft_fxNftId_idx" ON "Nft"("fxNftId");

-- CreateIndex
CREATE INDEX "PurchaseStaging_fxNftId_idx" ON "PurchaseStaging"("fxNftId");

-- CreateIndex
CREATE INDEX "PurchaseStaging_rawAccountId_idx" ON "PurchaseStaging"("rawAccountId");

-- CreateIndex
CREATE INDEX "TzAccount_address_idx" ON "TzAccount"("address");
