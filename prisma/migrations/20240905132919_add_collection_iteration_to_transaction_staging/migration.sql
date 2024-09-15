/*
  Warnings:

  - Added the required column `collection_iteration` to the `TransactionStaging` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "TransactionStaging" ADD COLUMN     "collection_iteration" INTEGER NOT NULL;
