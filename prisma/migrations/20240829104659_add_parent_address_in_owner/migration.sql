/*
  Warnings:

  - A unique constraint covering the columns `[parent_address]` on the table `TzAccountOwner` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `parent_address` to the `TzAccountOwner` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "TzAccountOwner" ADD COLUMN     "parent_address" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "TzAccountOwner_parent_address_key" ON "TzAccountOwner"("parent_address");
