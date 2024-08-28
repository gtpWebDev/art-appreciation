-- CreateTable
CREATE TABLE "PurchaseStaging" (
    "id" SERIAL NOT NULL,
    "isPrimary" BOOLEAN NOT NULL,
    "nftId" INTEGER NOT NULL,
    "accountId" INTEGER NOT NULL,
    "priceTz" DECIMAL(65,30) NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "score" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "PurchaseStaging_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ListingStaging" (
    "id" SERIAL NOT NULL,
    "isListing" BOOLEAN NOT NULL,
    "nftId" INTEGER NOT NULL,
    "accountId" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "score" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "ListingStaging_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PurchaseStaging" ADD CONSTRAINT "PurchaseStaging_nftId_fkey" FOREIGN KEY ("nftId") REFERENCES "Nft"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseStaging" ADD CONSTRAINT "PurchaseStaging_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "TzAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingStaging" ADD CONSTRAINT "ListingStaging_nftId_fkey" FOREIGN KEY ("nftId") REFERENCES "Nft"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingStaging" ADD CONSTRAINT "ListingStaging_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "TzAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
