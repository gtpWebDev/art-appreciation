const {
  collateQueryResults,
  teztok_FxhashActivityOnDate,
} = require("./extract/teztokQueries");

const {
  FIRST_FXHASH_DAY,
  TRANSACTION_TYPES,
} = require("../../constants/fxhashConstants");
const processTransaction = require("./transform/processTransaction");

const { loadNewPurchases } = require("./load/loadStage");

//poss temporary
const prisma = require("../../config/prismaClient");

const testDay = "2021-11-10";
const requestLimit = 1000;

/**
 * EXTRACT / TRANSFORM / LOAD PROCESS
 */

async function clearTables() {
  // TEMPORARY TO ALLOW RESET OF DB DURING DEV
  await prisma.$executeRaw`TRUNCATE TABLE "TzAccount" CASCADE;`;
  await prisma.$executeRaw`TRUNCATE TABLE "TzAccountOwner" CASCADE;`;
  await prisma.$executeRaw`TRUNCATE TABLE "Collection" CASCADE;`;
  await prisma.$executeRaw`TRUNCATE TABLE "PurchaseStaging" CASCADE;`;
  await prisma.$executeRaw`TRUNCATE TABLE "Nft" CASCADE;`;
  await prisma.$executeRaw`TRUNCATE TABLE "Purchase" CASCADE;`;
}
// clearTables();

async function main() {
  /**
   *  Extract stage - collect results for a [calendar day currently]
   */

  // TEMPORARY TO ALLOW RESET OF DB DURING DEV
  await prisma.$executeRaw`TRUNCATE TABLE "TzAccount" CASCADE;`;
  await prisma.$executeRaw`TRUNCATE TABLE "TzAccountOwner" CASCADE;`;
  await prisma.$executeRaw`TRUNCATE TABLE "Collection" CASCADE;`;
  await prisma.$executeRaw`TRUNCATE TABLE "PurchaseStaging" CASCADE;`;
  await prisma.$executeRaw`TRUNCATE TABLE "Nft" CASCADE;`;
  await prisma.$executeRaw`TRUNCATE TABLE "Purchase" CASCADE;`;

  const batch = await collateQueryResults(
    teztok_FxhashActivityOnDate,
    requestLimit,
    FIRST_FXHASH_DAY
  );
  console.log("Number of transactions in batch:", batch.data.length);

  /** Transform stage
   *
   *  Decision point 1:
   *  - Separate teztok requests for purchases and listings, then manage transform, or:
   *  - One request for all transactions
   *  - DECISION: One request as teztok queries can take a few seconds
   *
   *  - receives batch: {success:boolean, error: Error, data: dataArray}
   */

  if (batch.success) {
    const dataArray = batch.data;

    /**
     * Run through batch, separating and transforming transactions into
     * separate arrays ready for load
     */

    let purchases = [];
    let listings = [];

    dataArray.forEach((transaction) => {
      const transOutput = processTransaction(transaction);

      if (transOutput.transType === TRANSACTION_TYPES.PURCHASE) {
        purchases.push(transOutput.transData);
      }
      if (transOutput.transType === TRANSACTION_TYPES.LISTING) {
        listings.push(transOutput.transData);
      }
    });

    console.table(purchases);

    // THIS IS WHERE THE PRISMA TRANSACTION WOULD BEGIN

    // Purchases load stage (no dependencies)
    const result = await loadNewPurchases(purchases);
    // ***HERE***

    // Listings loaded to a staging table

    // Listings load to staging table
    // ***HERE***

    // collect most recent purchase timestamp for score calculation
    // HERE

    // load staging table into listing table
  }

  // Process complete
}

main();
