/*
  Warnings:

  - You are about to drop the `TransactionStagingTemp` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `artist_id` to the `Collection` table without a default value. This is not possible if the table is not empty.
  - Added the required column `editions` to the `Collection` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `Collection` table without a default value. This is not possible if the table is not empty.
  - Added the required column `thumbnail` to the `Collection` table without a default value. This is not possible if the table is not empty.
  - Added the required column `thumbnail` to the `Nft` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Collection" ADD COLUMN     "artist_id" INTEGER NOT NULL,
ADD COLUMN     "editions" INTEGER NOT NULL,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "thumbnail" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Nft" ADD COLUMN     "thumbnail" TEXT NOT NULL;

-- DropTable
DROP TABLE "TransactionStagingTemp";

-- CreateTable
CREATE TABLE "Artist" (
    "id" SERIAL NOT NULL,
    "address" TEXT NOT NULL,
    "alias" TEXT NOT NULL,

    CONSTRAINT "Artist_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Artist_address_key" ON "Artist"("address");

-- CreateIndex
CREATE INDEX "Artist_address_idx" ON "Artist"("address");

-- CreateIndex
CREATE INDEX "Artist_alias_idx" ON "Artist"("alias");

-- AddForeignKey
ALTER TABLE "Collection" ADD CONSTRAINT "Collection_artist_id_fkey" FOREIGN KEY ("artist_id") REFERENCES "Artist"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
