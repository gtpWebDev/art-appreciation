-- CreateTable
CREATE TABLE "TzAccountOwner" (
    "id" SERIAL NOT NULL,

    CONSTRAINT "TzAccountOwner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TzAccount" (
    "id" SERIAL NOT NULL,
    "address" TEXT NOT NULL,
    "artist" BOOLEAN NOT NULL DEFAULT false,
    "ownerId" INTEGER NOT NULL,
    "score" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "TzAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Collection" (
    "id" SERIAL NOT NULL,
    "fxCollectionId" TEXT NOT NULL,

    CONSTRAINT "Collection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Nft" (
    "id" SERIAL NOT NULL,
    "fxNftId" TEXT NOT NULL,
    "collectionId" INTEGER NOT NULL,

    CONSTRAINT "Nft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Purchase" (
    "id" SERIAL NOT NULL,
    "isPrimary" BOOLEAN NOT NULL,
    "nftId" INTEGER NOT NULL,
    "accountId" INTEGER NOT NULL,
    "priceTz" DECIMAL(65,30) NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "score" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "Purchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Listing" (
    "id" SERIAL NOT NULL,
    "isListing" BOOLEAN NOT NULL,
    "nftId" INTEGER NOT NULL,
    "accountId" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "score" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "Listing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TzAccount_address_key" ON "TzAccount"("address");

-- CreateIndex
CREATE UNIQUE INDEX "Collection_fxCollectionId_key" ON "Collection"("fxCollectionId");

-- CreateIndex
CREATE UNIQUE INDEX "Nft_fxNftId_key" ON "Nft"("fxNftId");

-- AddForeignKey
ALTER TABLE "TzAccount" ADD CONSTRAINT "TzAccount_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "TzAccountOwner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Nft" ADD CONSTRAINT "Nft_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_nftId_fkey" FOREIGN KEY ("nftId") REFERENCES "Nft"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "TzAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_nftId_fkey" FOREIGN KEY ("nftId") REFERENCES "Nft"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "TzAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
