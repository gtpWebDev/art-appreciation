/*
  Warnings:

  - A unique constraint covering the columns `[address]` on the table `TzAccountOwner` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `address` to the `TzAccountOwner` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "TzAccountOwner" ADD COLUMN     "address" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "TzAccountOwner_address_key" ON "TzAccountOwner"("address");
