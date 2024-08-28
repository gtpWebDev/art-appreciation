/*
  Warnings:

  - You are about to drop the column `nftId` on the `PurchaseStaging` table. All the data in the column will be lost.
  - Added the required column `fxNftId` to the `PurchaseStaging` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PurchaseStaging" DROP COLUMN "nftId",
ADD COLUMN     "fxNftId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "PurchaseStaging" ADD CONSTRAINT "PurchaseStaging_fxNftId_fkey" FOREIGN KEY ("fxNftId") REFERENCES "Nft"("fxNftId") ON DELETE RESTRICT ON UPDATE CASCADE;
