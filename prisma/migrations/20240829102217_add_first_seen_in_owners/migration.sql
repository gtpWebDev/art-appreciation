/*
  Warnings:

  - Added the required column `first_seen` to the `TzAccountOwner` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "TzAccountOwner" ADD COLUMN     "first_seen" TIMESTAMP(3) NOT NULL;
