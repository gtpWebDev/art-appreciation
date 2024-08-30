/*
  Warnings:

  - The primary key for the `Nft` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `fx_nft_id` on the `Nft` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Listing" DROP CONSTRAINT "Listing_nft_id_fkey";

-- DropForeignKey
ALTER TABLE "Purchase" DROP CONSTRAINT "Purchase_nft_id_fkey";

-- DropIndex
DROP INDEX "Nft_fx_nft_id_idx";

-- DropIndex
DROP INDEX "Nft_fx_nft_id_key";

-- AlterTable
ALTER TABLE "Listing" ALTER COLUMN "nft_id" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "Nft" DROP CONSTRAINT "Nft_pkey",
DROP COLUMN "fx_nft_id",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Nft_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Nft_id_seq";

-- AlterTable
ALTER TABLE "Purchase" ALTER COLUMN "nft_id" SET DATA TYPE TEXT;

-- AddForeignKey
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_nft_id_fkey" FOREIGN KEY ("nft_id") REFERENCES "Nft"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_nft_id_fkey" FOREIGN KEY ("nft_id") REFERENCES "Nft"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
