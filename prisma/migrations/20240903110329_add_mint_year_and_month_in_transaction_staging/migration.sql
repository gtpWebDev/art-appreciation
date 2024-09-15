/*
  Warnings:

  - Added the required column `nft_mint_month` to the `TransactionStaging` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nft_mint_year` to the `TransactionStaging` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "TransactionStaging" ADD COLUMN     "nft_mint_month" INTEGER NOT NULL,
ADD COLUMN     "nft_mint_year" INTEGER NOT NULL;
