-- AlterTable
ALTER TABLE "TransactionStagingTemp" ALTER COLUMN "id" DROP DEFAULT;
DROP SEQUENCE "TransactionStagingTemp_id_seq";
