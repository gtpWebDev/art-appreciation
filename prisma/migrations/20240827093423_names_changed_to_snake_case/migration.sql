/*
  Warnings:

  - You are about to drop the column `fxCollectionId` on the `Collection` table. All the data in the column will be lost.
  - You are about to drop the column `accountId` on the `Listing` table. All the data in the column will be lost.
  - You are about to drop the column `isListing` on the `Listing` table. All the data in the column will be lost.
  - You are about to drop the column `nftId` on the `Listing` table. All the data in the column will be lost.
  - You are about to drop the column `fxNftId` on the `ListingStaging` table. All the data in the column will be lost.
  - You are about to drop the column `isListing` on the `ListingStaging` table. All the data in the column will be lost.
  - You are about to drop the column `rawAccountId` on the `ListingStaging` table. All the data in the column will be lost.
  - You are about to drop the column `collectionId` on the `Nft` table. All the data in the column will be lost.
  - You are about to drop the column `fxNftId` on the `Nft` table. All the data in the column will be lost.
  - You are about to drop the column `accountId` on the `Purchase` table. All the data in the column will be lost.
  - You are about to drop the column `isPrimary` on the `Purchase` table. All the data in the column will be lost.
  - You are about to drop the column `nftId` on the `Purchase` table. All the data in the column will be lost.
  - You are about to drop the column `priceTz` on the `Purchase` table. All the data in the column will be lost.
  - You are about to drop the column `fxNftId` on the `PurchaseStaging` table. All the data in the column will be lost.
  - You are about to drop the column `isPrimary` on the `PurchaseStaging` table. All the data in the column will be lost.
  - You are about to drop the column `priceTz` on the `PurchaseStaging` table. All the data in the column will be lost.
  - You are about to drop the column `rawAccountId` on the `PurchaseStaging` table. All the data in the column will be lost.
  - You are about to drop the column `ownerId` on the `TzAccount` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[fx_collection_id]` on the table `Collection` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[fx_nft_id]` on the table `Nft` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `fx_collection_id` to the `Collection` table without a default value. This is not possible if the table is not empty.
  - Added the required column `account_id` to the `Listing` table without a default value. This is not possible if the table is not empty.
  - Added the required column `is_listing` to the `Listing` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nft_id` to the `Listing` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fx_nft_id` to the `ListingStaging` table without a default value. This is not possible if the table is not empty.
  - Added the required column `is_listing` to the `ListingStaging` table without a default value. This is not possible if the table is not empty.
  - Added the required column `raw_account_id` to the `ListingStaging` table without a default value. This is not possible if the table is not empty.
  - Added the required column `collection_id` to the `Nft` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fx_nft_id` to the `Nft` table without a default value. This is not possible if the table is not empty.
  - Added the required column `account_id` to the `Purchase` table without a default value. This is not possible if the table is not empty.
  - Added the required column `is_primary` to the `Purchase` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nft_id` to the `Purchase` table without a default value. This is not possible if the table is not empty.
  - Added the required column `price_tz` to the `Purchase` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fx_nft_id` to the `PurchaseStaging` table without a default value. This is not possible if the table is not empty.
  - Added the required column `is_primary` to the `PurchaseStaging` table without a default value. This is not possible if the table is not empty.
  - Added the required column `price_tz` to the `PurchaseStaging` table without a default value. This is not possible if the table is not empty.
  - Added the required column `raw_account_id` to the `PurchaseStaging` table without a default value. This is not possible if the table is not empty.
  - Added the required column `owner_id` to the `TzAccount` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Listing" DROP CONSTRAINT "Listing_accountId_fkey";

-- DropForeignKey
ALTER TABLE "Listing" DROP CONSTRAINT "Listing_nftId_fkey";

-- DropForeignKey
ALTER TABLE "Nft" DROP CONSTRAINT "Nft_collectionId_fkey";

-- DropForeignKey
ALTER TABLE "Purchase" DROP CONSTRAINT "Purchase_accountId_fkey";

-- DropForeignKey
ALTER TABLE "Purchase" DROP CONSTRAINT "Purchase_nftId_fkey";

-- DropForeignKey
ALTER TABLE "TzAccount" DROP CONSTRAINT "TzAccount_ownerId_fkey";

-- DropIndex
DROP INDEX "Collection_fxCollectionId_key";

-- DropIndex
DROP INDEX "ListingStaging_fxNftId_idx";

-- DropIndex
DROP INDEX "ListingStaging_rawAccountId_idx";

-- DropIndex
DROP INDEX "Nft_fxNftId_idx";

-- DropIndex
DROP INDEX "Nft_fxNftId_key";

-- DropIndex
DROP INDEX "PurchaseStaging_fxNftId_idx";

-- DropIndex
DROP INDEX "PurchaseStaging_rawAccountId_idx";

-- AlterTable
ALTER TABLE "Collection" DROP COLUMN "fxCollectionId",
ADD COLUMN     "fx_collection_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Listing" DROP COLUMN "accountId",
DROP COLUMN "isListing",
DROP COLUMN "nftId",
ADD COLUMN     "account_id" INTEGER NOT NULL,
ADD COLUMN     "is_listing" BOOLEAN NOT NULL,
ADD COLUMN     "nft_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "ListingStaging" DROP COLUMN "fxNftId",
DROP COLUMN "isListing",
DROP COLUMN "rawAccountId",
ADD COLUMN     "fx_nft_id" TEXT NOT NULL,
ADD COLUMN     "is_listing" BOOLEAN NOT NULL,
ADD COLUMN     "raw_account_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Nft" DROP COLUMN "collectionId",
DROP COLUMN "fxNftId",
ADD COLUMN     "collection_id" INTEGER NOT NULL,
ADD COLUMN     "fx_nft_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Purchase" DROP COLUMN "accountId",
DROP COLUMN "isPrimary",
DROP COLUMN "nftId",
DROP COLUMN "priceTz",
ADD COLUMN     "account_id" INTEGER NOT NULL,
ADD COLUMN     "is_primary" BOOLEAN NOT NULL,
ADD COLUMN     "nft_id" INTEGER NOT NULL,
ADD COLUMN     "price_tz" DECIMAL(65,30) NOT NULL;

-- AlterTable
ALTER TABLE "PurchaseStaging" DROP COLUMN "fxNftId",
DROP COLUMN "isPrimary",
DROP COLUMN "priceTz",
DROP COLUMN "rawAccountId",
ADD COLUMN     "fx_nft_id" TEXT NOT NULL,
ADD COLUMN     "is_primary" BOOLEAN NOT NULL,
ADD COLUMN     "price_tz" DECIMAL(65,30) NOT NULL,
ADD COLUMN     "raw_account_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "TzAccount" DROP COLUMN "ownerId",
ADD COLUMN     "owner_id" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Collection_fx_collection_id_key" ON "Collection"("fx_collection_id");

-- CreateIndex
CREATE INDEX "ListingStaging_fx_nft_id_idx" ON "ListingStaging"("fx_nft_id");

-- CreateIndex
CREATE INDEX "ListingStaging_raw_account_id_idx" ON "ListingStaging"("raw_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "Nft_fx_nft_id_key" ON "Nft"("fx_nft_id");

-- CreateIndex
CREATE INDEX "Nft_fx_nft_id_idx" ON "Nft"("fx_nft_id");

-- CreateIndex
CREATE INDEX "PurchaseStaging_fx_nft_id_idx" ON "PurchaseStaging"("fx_nft_id");

-- CreateIndex
CREATE INDEX "PurchaseStaging_raw_account_id_idx" ON "PurchaseStaging"("raw_account_id");

-- AddForeignKey
ALTER TABLE "TzAccount" ADD CONSTRAINT "TzAccount_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "TzAccountOwner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Nft" ADD CONSTRAINT "Nft_collection_id_fkey" FOREIGN KEY ("collection_id") REFERENCES "Collection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_nft_id_fkey" FOREIGN KEY ("nft_id") REFERENCES "Nft"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "TzAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_nft_id_fkey" FOREIGN KEY ("nft_id") REFERENCES "Nft"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "TzAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
