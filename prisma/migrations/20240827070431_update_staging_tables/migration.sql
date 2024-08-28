-- DropForeignKey
ALTER TABLE "ListingStaging" DROP CONSTRAINT "ListingStaging_accountId_fkey";

-- DropForeignKey
ALTER TABLE "ListingStaging" DROP CONSTRAINT "ListingStaging_nftId_fkey";

-- DropForeignKey
ALTER TABLE "PurchaseStaging" DROP CONSTRAINT "PurchaseStaging_accountId_fkey";

-- DropForeignKey
ALTER TABLE "PurchaseStaging" DROP CONSTRAINT "PurchaseStaging_nftId_fkey";

-- AlterTable
ALTER TABLE "ListingStaging" ALTER COLUMN "nftId" SET DATA TYPE TEXT,
ALTER COLUMN "accountId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "PurchaseStaging" ALTER COLUMN "nftId" SET DATA TYPE TEXT,
ALTER COLUMN "accountId" SET DATA TYPE TEXT;
