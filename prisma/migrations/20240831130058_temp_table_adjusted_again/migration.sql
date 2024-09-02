/*
  Warnings:

  - The primary key for the `TransactionStagingTemp` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "TransactionStagingTemp" DROP CONSTRAINT "TransactionStagingTemp_pkey",
ADD COLUMN     "unique_id" SERIAL NOT NULL,
ADD CONSTRAINT "TransactionStagingTemp_pkey" PRIMARY KEY ("unique_id");
