const {
  // collateQueryResults,
  teztok_FxhashActivityBatch,
} = require("./extract/teztokQueries");

const {
  FIRST_FXHASH_DAY,
  EARLIEST_TIMESTAMP,
  TRANSACTION_TYPES,
} = require("../../constants/fxhashConstants");
const processTransaction = require("./transform/processTransaction");

const {
  addXDaysToDate,
  formatDateToYYYYMMDD,
  getStartOfYesterday,
} = require("../dateFunctions");

const loadStage = require("./load/loadStage");

//poss temporary
const prisma = require("../../config/prismaClient");
const { getExchangeRatesBetween } = require("../getExchangeRates");

/**
 * EXTRACT-TRANSFORM-LOAD APPROACH
 *
 * OVERALL: The etlProcess function will collect data from the latest of
 *           - a date before the very first fx hash transaction, and
 *           - the latest transaction added to either the Purchase or Listing
 *             tables in the database
 *          It will continue until no data is returned for a batch, where the
 *          request collects data until the end of yesterday - never for today
 *          When no data is returned, it will complete.
 *          This function is designed to be used within a job scheduler that
 *          will run each day.
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
 * TO DO:
 *  - check documentation (for example here) is up to date
 *  - check main update stage is within a transaction to avoid incomplete
 *    part additions
 *  - full process review to ensure behaves as I want for any kind of error
 *  - review all procedures to being up to professional standard
 *  - full appropriate testing of process
 */

// run parameters during dev
const testMode = false;
const batchSize = 2000;

async function etlProcess() {
  if (testMode) await clearTables();

  // first batch based on last db transaction, or earliest date
  let batchTimestamp = await selectInitialBatchTimestamp();

  let latestExchangeRateDate;

  // dev only, tracking number of transactions removed due to no primary purchase existing
  let transactionsRemoved = 0;

  // repeated ETL process by batch

  let batchData = [];

  do {
    const start = Date.now(); // used to measure elapsed time for batch

    /**
     *  Batches defined by a number of transactions with timestamp strictly
     *  later than batchTimestamp.
     */
    batchData = await generateBatchData(batchTimestamp, batchSize);

    if (batchData.length !== 0) {
      // batch data exists, process it (no transactions returns [])

      console.log("");
      console.log(
        `Batch of ${batchData.length} strictly after ${batchTimestamp}`
      );

      // update exchange rate data whenever it is not current up to yesterday
      const startOfYesterday = getStartOfYesterday();
      if (
        !latestExchangeRateDate ||
        latestExchangeRateDate < startOfYesterday
      ) {
        latestExchangeRateDate = await updateExchangeRateData();
      }

      const { newTransactionsRemoved, batchFullyProcessed } =
        await processBatch(batchData);

      // If batch completed, generate next batch timestamp, otherwise effectively repeats
      // (batch not complete means no transactions updated)
      if (batchFullyProcessed) {
        batchTimestamp = await collectNextBatchTimestamp(batchData);
      }

      transactionsRemoved += newTransactionsRemoved;
      console.log(
        `Running total - transactions removed: ${transactionsRemoved}`
      );

      const duration = Date.now() - start;
      console.log(`Batch complete. ${duration}ms`);
    }
  } while (batchData.length > 0); // continue until no data is returned
  console.log("No more data returned. Process complete.");
}

etlProcess();

// FUNCTIONS SUPPORTING MAIN PROCESS BELOW

async function selectInitialBatchTimestamp() {
  /**
   *  Get latest database transaction timestamp from Purchase / Listing tables
   *  If no transactions exist, use earliestTimestamp
   *  Returns ISO 8601 format
   */

  const latestDbTransactionDateTime = await getLatestDbTransactionDateTime();
  const latestTransactionDateTime =
    latestDbTransactionDateTime ?? new Date(EARLIEST_TIMESTAMP);

  return latestTransactionDateTime.toISOString();
}

/**
 * Generate batch data
 * @param {*} batchTimestamp -
 * @param {*} batchSize
 * @returns {batchData: Object}
 */
const generateBatchData = async (batchTimestamp, batchSize) => {
  /**
   * Collect transactions with timestamp strictly greater than batchTimestamp
   * Number of transactions = batchSize
   * Then remove final timestamp transactions from within batch to use this
   * as clean start for next batch.
   */

  const provisionalBatch = await teztok_FxhashActivityBatch(
    batchTimestamp,
    batchSize
  ); // {success:boolean, error: Error, data: dataArray}

  if (!provisionalBatch.success) {
    // need to replace this with a command to attempt to continue
    // process in X hours
    throw new Error(provisionalBatch.error);
  }

  // remove transactions with latest timestamp
  const provisionalBatchData = provisionalBatch.data;

  const mostRecentTimestamp =
    provisionalBatchData[provisionalBatchData.length - 1].timestamp;
  const finalBatch = provisionalBatchData.filter(
    (ele) => ele.timestamp !== mostRecentTimestamp
  );

  return finalBatch;
};

const collectNextBatchTimestamp = async (batchData) => {
  /**
   * Next batch timestamp is simply the latest timestamp
   * from the current batch.
   */

  // batch is timestamp ascending
  return batchData[batchData.length - 1].timestamp;
};

async function getLatestExchangeRateDate() {
  const latestExchangeRateDate = await prisma.tezosCurrencyRate.findFirst({
    orderBy: {
      date: "desc",
    },
    select: {
      date: true,
    },
  });

  return latestExchangeRateDate ? latestExchangeRateDate.date : null;
}

async function updateExchangeRateData() {
  /**
   * Task here is always to fill the gap between the latest data in the
   * TezosCurrencyRate table, and yesterday. Specifically not collecting
   * today's rate.
   */
  // Get latest date in TezosCurrencyRate table
  let latestDbExchangeRateDate = await getLatestExchangeRateDate();

  const firstMissingDbDate = addXDaysToDate(latestDbExchangeRateDate, 1);

  // use latest between FIRST_FXHASH_DAY and table date
  // Collect data for day after latest of these, up to yesterday
  const earliestDate = new Date(FIRST_FXHASH_DAY);
  const startDate =
    firstMissingDbDate > earliestDate ? firstMissingDbDate : earliestDate;

  const endDate = addXDaysToDate(new Date(), -1);

  const startDateFormat = formatDateToYYYYMMDD(startDate);
  const endDateFormat = formatDateToYYYYMMDD(endDate);

  const exchangeRateData = await getExchangeRatesBetween(
    startDateFormat,
    endDateFormat
  );

  // Add any new rates to the database
  if (exchangeRateData) {
    await prisma.tezosCurrencyRate.createMany({
      data: exchangeRateData,
    });

    // update new latest date
    latestDbExchangeRateDate = await getLatestExchangeRateDate();
  }

  return latestDbExchangeRateDate;
}

async function processBatch(batch) {
  // Run through batch, transforming data into form required by staging table

  let transformedTransactions = [];

  batch.forEach((transaction) => {
    const transOutput = processTransaction(transaction);
    if (!transOutput.success) throw new Error("processTransaction failed");
    transformedTransactions.push(transOutput.transData);
  });

  const { batchFullyProcessed, newTransactionsRemoved } = await loadStage(
    transformedTransactions
  );
  return { batchFullyProcessed, newTransactionsRemoved };
}

async function clearTables() {
  // apply with care, resets to an empty database!
  // await prisma.$executeRaw`TRUNCATE TABLE "TezosCurrencyRate";`;
  await prisma.$executeRaw`TRUNCATE TABLE "TransactionStaging";`;
  await prisma.$executeRaw`TRUNCATE TABLE "Purchase";`;
  await prisma.$executeRaw`TRUNCATE TABLE "Listing";`;
  await prisma.$executeRaw`TRUNCATE TABLE "Nft" CASCADE;`;
  await prisma.$executeRaw`TRUNCATE TABLE "Collection" CASCADE;`;
  await prisma.$executeRaw`TRUNCATE TABLE "Artist" CASCADE;`;
  await prisma.$executeRaw`TRUNCATE TABLE "TzAccount" CASCADE;`;
  await prisma.$executeRaw`TRUNCATE TABLE "TzAccountOwner" CASCADE;`;
  console.log("Tables cleared");
  // throw new Error();
}

async function getLatestDbTransactionDateTime() {
  /**
   * Get most recent timestamp in the transaction tables - Purchase and Listing
   * Return the most recent of the two, in ISO 8601 form
   */

  const purchaseResponse = await prisma.purchase.findFirst({
    orderBy: {
      timestamp: "desc",
    },
    select: {
      timestamp: true,
    },
  });
  const latestPurchase = purchaseResponse ? purchaseResponse.timestamp : null;

  const listingresponse = await prisma.listing.findFirst({
    orderBy: {
      timestamp: "desc",
    },
    select: {
      timestamp: true,
    },
  });
  const latestListing = listingresponse ? listingresponse.timestamp : null;

  return latestDate(latestPurchase, latestListing);
}

function latestDate(d1, d2) {
  if (!d1 && !d2) return null;

  if (!d1) return d2;
  if (!d2) return d1;

  return d2 > d1 ? d2 : d1;
}

function isLater(timestamp, checkTimestamp) {
  const date1 = new Date(timestamp);
  const date2 = new Date(checkTimestamp);
  return date1 > date2;
}
