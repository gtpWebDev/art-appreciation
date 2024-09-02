const {
  // collateQueryResults,
  teztok_FxhashActivityFromTimestamp,
} = require("./extract/teztokQueries");

const {
  FIRST_FXHASH_DAY,
  TRANSACTION_TYPES,
} = require("../../constants/fxhashConstants");
const processTransaction = require("./transform/processTransaction");

const loadNewPurchases = require("./load/loadPurchases");
const loadNewListings = require("./load/loadListings");

const loadStage = require("./load/loadStage");

//poss temporary
const prisma = require("../../config/prismaClient");

const earliestTimestamp = "2021-11-03T00:00:00"; // before first fxhash transaction

/**
 * EXTRACT-TRANSFORM-LOAD APPROACH
 *
 * EXTRACT:
 * - Batched into a number of transactions.
 * - Batch consists of all relevant transaction types - primary purchase,
 *    secondary purchase, list, delist
 * - After collecting, all transactions with final timestamp are removed to
 *    enable that timestamp to be used as the start point for the next batch
 * - Some collection ids missing in data - replaced with dummy id "999999"
 *
 * TRANSFORM AND LOAD:
 * - Transactions split into Purchases (Pri and Sec) and Listings (list and delist)
 * - Purchases:
 *   - Purchase array is added to PurchaseStaging table
 *   - Accounts and Owners:
 *     - Primary keys of both autoincrement due to large size of addresses
 *     - Transaction used to add both at same time
 *     - Not seen accounts provisionally added to TzAccountOwner table
 *     - New TzAccountOwners used to construct new Accounts
 *     - New accounts added to TzAccounts
 *   - Collections:
 *     - Primary key is the fx_collection_id
 *     - Not seen collection_ids added to Collection table
 *   - Nfts:
 *     - Primary key is the fx_nft_id (part of fa2 and token_id)
 *     - Not seen fx_nft_ids FOR PRIMARY SALES ONLY added to Nft table
 *         because data with no beginning primary sale is not acceptable
 *         **REF1**
 *   - Purchases:
 *     - Remove non-primary purchases with no matching Nft - see **REF1**
 *     - Remaining purchses added to Purchases table
 *
 */

// run parameters during dev
const testMode = true;
let endAfter = "2024-11-21T16:00:00";
const batchSize = 2000;

async function etlProcess() {
  let batchTimestamp = "";
  if (testMode) {
    await clearTables();
    batchTimestamp = earliestTimestamp;
  } else {
    // need to add appropriate error control
    batchTimestamp = await getLatestDbTimestamp();
    batchTimestamp = batchTimestamp.toString();
    console.log("batchTimestamp", batchTimestamp);
    endAfter = "2022-11-21T16:00:00";
  }

  // dev only, tracking number of transactions removed due to no primary purchase existing
  let transactionsRemoved = 0;

  /** Batches defined by total number of transactions with transactions from
   *  latest timestamp in batch removed, so can start next batch from that
   *  timestamp
   *
   *  Single collection of purchases and listings, given teztok request can take a while
   */

  do {
    const start = Date.now();

    // receives batch: {success:boolean, error: Error, data: dataArray}
    const provisionalBatch = await teztok_FxhashActivityFromTimestamp(
      batchTimestamp,
      batchSize
    );
    if (!provisionalBatch.success) throw new Error(provisionalBatch.error);

    const { amendedBatch, mostRecentTimestamp } = removeLatestTransactions(
      provisionalBatch.data
    );

    console.log("");
    console.log(
      `Processing batch of ${amendedBatch.length} from ${batchTimestamp} to ${mostRecentTimestamp}`
    );

    const { newTransactionsRemoved, batchFullyProcessed } = await processBatch(
      amendedBatch,
      mostRecentTimestamp
    );

    transactionsRemoved += newTransactionsRemoved;

    console.log(`Running total - transactions removed: ${transactionsRemoved}`);

    // update details for next batch
    batchTimestamp = mostRecentTimestamp;

    const duration = Date.now() - start;
    console.log(`Batch took ${duration}ms`);
  } while (!isLater(batchTimestamp, endAfter));
}

etlProcess();

function removeLatestTransactions(provBatch) {
  const mostRecentTimestamp = provBatch[provBatch.length - 1].timestamp;

  const amendedBatch = provBatch.filter(
    (ele) => ele.timestamp !== mostRecentTimestamp
  );

  return {
    amendedBatch,
    mostRecentTimestamp,
  };
}

async function processBatch(batch, mostRecentTimestamp) {
  // Run through batch, transforming data into form required by staging table

  let transformedTransactions = [];

  batch.forEach((transaction) => {
    const transOutput = processTransaction(transaction);
    if (!transOutput.success) throw new Error("processTransaction failed");
    transformedTransactions.push(transOutput.transData);
  });

  const { batchFullyProcessed, newTransactionsRemoved } = await loadStage(
    transformedTransactions,
    mostRecentTimestamp
  );
  return { batchFullyProcessed, newTransactionsRemoved };
}

async function clearTables() {
  // apply with care, resets to an empty database!
  await prisma.$executeRaw`TRUNCATE TABLE "TransactionStaging";`;
  await prisma.$executeRaw`TRUNCATE TABLE "Purchase";`;
  await prisma.$executeRaw`TRUNCATE TABLE "Listing";`;
  await prisma.$executeRaw`TRUNCATE TABLE "Nft" CASCADE;`;
  await prisma.$executeRaw`TRUNCATE TABLE "Collection" CASCADE;`;
  await prisma.$executeRaw`TRUNCATE TABLE "TzAccount" CASCADE;`;
  await prisma.$executeRaw`TRUNCATE TABLE "TzAccountOwner" CASCADE;`;
  console.log("Tables cleared");
}

async function getLatestDbTimestamp() {
  // startTimestamp
  // deal with no transactions, replacing with global startTimestamp
  // currently untested as all data so far run from start

  const latestPurchaseTimestamp = await prisma.purchase.findFirst({
    orderBy: {
      timestamp: "desc",
    },
    select: {
      timestamp: true,
    },
  });

  const formattedPurchaseTimestamp = latestPurchaseTimestamp.timestamp
    .toISOString()
    .split(".")[0];

  console.log("Latest timestamp in Purchases:", formattedPurchaseTimestamp);
  const latestListingTimestamp = await prisma.listing.findFirst({
    orderBy: {
      timestamp: "desc",
    },
    select: {
      timestamp: true,
    },
  });

  const formattedListingTimestamp = latestListingTimestamp.timestamp
    .toISOString()
    .split(".")[0];

  console.log("Latest timestamp in Listings:", formattedListingTimestamp);

  const date1 = new Date(formattedPurchaseTimestamp);
  const date2 = new Date(formattedListingTimestamp);

  const latestTimestamp =
    date1 > date2 ? formattedPurchaseTimestamp : formattedListingTimestamp;

  return latestTimestamp;
}

function isLater(timestamp, checkTimestamp) {
  const date1 = new Date(timestamp);
  const date2 = new Date(checkTimestamp);
  return date1 > date2;
}
