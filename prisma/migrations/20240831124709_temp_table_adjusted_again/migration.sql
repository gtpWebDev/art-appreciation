/*
  Warnings:

  - Changed the type of `account_id` on the `TransactionStagingTemp` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "TransactionStagingTemp" DROP COLUMN "account_id",
ADD COLUMN     "account_id" INTEGER NOT NULL;
