/*
  Warnings:

  - You are about to drop the column `collection_id` on the `TransactionStagingTemp` table. All the data in the column will be lost.
  - You are about to drop the column `fx_nft_id` on the `TransactionStagingTemp` table. All the data in the column will be lost.
  - You are about to drop the column `raw_account_id` on the `TransactionStagingTemp` table. All the data in the column will be lost.
  - Added the required column `account_id` to the `TransactionStagingTemp` table without a default value. This is not possible if the table is not empty.
  - Added the required column `most_recent_purchase_timestamp` to the `TransactionStagingTemp` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nft_id` to the `TransactionStagingTemp` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "TransactionStagingTemp_collection_id_idx";

-- DropIndex
DROP INDEX "TransactionStagingTemp_fx_nft_id_idx";

-- DropIndex
DROP INDEX "TransactionStagingTemp_raw_account_id_idx";

-- DropIndex
DROP INDEX "TransactionStagingTemp_timestamp_idx";

-- AlterTable
ALTER TABLE "TransactionStagingTemp" DROP COLUMN "collection_id",
DROP COLUMN "fx_nft_id",
DROP COLUMN "raw_account_id",
ADD COLUMN     "account_id" TEXT NOT NULL,
ADD COLUMN     "most_recent_purchase_price_tz" DECIMAL(65,30),
ADD COLUMN     "most_recent_purchase_timestamp" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "nft_id" TEXT NOT NULL;
