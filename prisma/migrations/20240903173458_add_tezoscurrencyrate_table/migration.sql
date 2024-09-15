-- CreateTable
CREATE TABLE "TezosCurrencyRate" (
    "id" SERIAL NOT NULL,
    "date" DATE NOT NULL,
    "rate" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "TezosCurrencyRate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TezosCurrencyRate_date_key" ON "TezosCurrencyRate"("date");

-- CreateIndex
CREATE INDEX "TezosCurrencyRate_date_idx" ON "TezosCurrencyRate"("date");
