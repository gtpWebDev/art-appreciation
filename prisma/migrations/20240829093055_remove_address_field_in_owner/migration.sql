/*
  Warnings:

  - You are about to drop the column `address` on the `TzAccountOwner` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "TzAccountOwner_address_key";

-- AlterTable
ALTER TABLE "TzAccountOwner" DROP COLUMN "address";
