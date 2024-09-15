/*
  Warnings:

  - Added the required column `artist_address` to the `TransactionStaging` table without a default value. This is not possible if the table is not empty.
  - Added the required column `artist_alias` to the `TransactionStaging` table without a default value. This is not possible if the table is not empty.
  - Added the required column `collection_editions` to the `TransactionStaging` table without a default value. This is not possible if the table is not empty.
  - Added the required column `collection_name` to the `TransactionStaging` table without a default value. This is not possible if the table is not empty.
  - Added the required column `collection_thumbnail` to the `TransactionStaging` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nft_thumbnail` to the `TransactionStaging` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "TransactionStaging" ADD COLUMN     "artist_address" TEXT NOT NULL,
ADD COLUMN     "artist_alias" TEXT NOT NULL,
ADD COLUMN     "collection_editions" INTEGER NOT NULL,
ADD COLUMN     "collection_name" TEXT NOT NULL,
ADD COLUMN     "collection_thumbnail" TEXT NOT NULL,
ADD COLUMN     "nft_thumbnail" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "TransactionStaging_artist_address_idx" ON "TransactionStaging"("artist_address");
