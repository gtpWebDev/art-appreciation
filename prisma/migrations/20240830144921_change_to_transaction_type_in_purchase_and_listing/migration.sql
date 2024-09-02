/*
  Warnings:

  - You are about to drop the column `is_listing` on the `Listing` table. All the data in the column will be lost.
  - You are about to drop the column `is_primary` on the `Purchase` table. All the data in the column will be lost.
  - Added the required column `transaction_type` to the `Listing` table without a default value. This is not possible if the table is not empty.
  - Added the required column `transaction_type` to the `Purchase` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Listing" DROP COLUMN "is_listing",
ADD COLUMN     "transaction_type" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Purchase" DROP COLUMN "is_primary",
ADD COLUMN     "transaction_type" TEXT NOT NULL;
