/**
 * Note, the contents here include significant Transform with the Load stage
 */

const prisma = require("../../../config/prismaClient");

const calcAAIScore = require("../transform/aaiScore");

const { TRANSACTION_TYPES } = require("../../../constants/fxhashConstants");

const loadStage = async (transactions, mostRecentTimestamp) => {
  let batchFullyProcessed = false;

  // console.log("loadStage transactions", transactions);

  // Stage 0: Load transactions into TransactionStaging table
  await truncateTransactionStagingTable();
  await addTransactionsToStaging(transactions);

  // Load new owners/accounts/collections/Nfts
  // Fully repeatable stage should batch process fail after
  const { newTzAccountOwners, newTzAccounts, newCollections, newNfts } =
    await addNewElements();

  console.log(
    `Added TzAccountOwners: ${newTzAccountOwners}, TzAccounts: ${newTzAccounts}, Collections: ${newCollections}, NFTs: ${newNfts}`
  );

  // Remove unmatched transactions from staging table
  const newTransactionsRemoved = await removeTransactionsWithUnmatchedNfts();

  console.log(
    `Transactions with unmatched NFTs removed: ${newTransactionsRemoved}`
  );

  // CHECK REMOVALS - SEEMS HIGH

  // From this point, repeat of process would cause duplicates
  // prisma transaction and message back to batch control will ensure
  // process isn't repeatable for the same data

  // PROCESS NOT TRUSTED OR REFINED AFTER THIS POINT

  const { newPurchaseCount, newListingCount } =
    await calcScoresAndAddTransactions(mostRecentTimestamp);

  console.log(
    `Added Purchases: ${newPurchaseCount}, Added Listings: ${newListingCount}`
  );

  // Batch fully completed, return details to inform next batch
  batchFullyProcessed = true;

  return { batchFullyProcessed, newTransactionsRemoved };
};

const truncateTransactionStagingTable = async () => {
  try {
    await prisma.$executeRaw`TRUNCATE TABLE "TransactionStaging";`;
  } catch (error) {
    console.error("Error truncating table:", error);
  }
};

const addTransactionsToStaging = async (transactions) => {
  try {
    await prisma.transactionStaging.createMany({
      data: transactions,
    });
  } catch (error) {
    console.error("Error moving transactions to staging table", error);
  }
};

const addNewElements = async () => {
  const { newTzAccountOwners, newTzAccounts } = await addNewOwnersAndAccounts();

  const newCollections = await addNewCollections();

  const newNfts = await addNewNfts();

  return { newTzAccountOwners, newTzAccounts, newCollections, newNfts };
};

const addNewOwnersAndAccounts = async () => {
  /**
   * TzAccountOwners are a subset of TzAccounts. Need to identify accounts that
   * do not exist in TzAccounts, then can safely assume they exist in neither.
   */

  try {
    let newTzAccountOwners;
    let newTzAccounts;

    await prisma.$transaction(async (prisma) => {
      // transaction ensures new owners and accounts added together

      // Find accounts not currently in the database
      // outputs array of form: { raw_account_id: 'tz1a2ZeWmyNQ8BiuFNTE4vmFEP9MBaP76QPX' }
      const missingAccounts = await prisma.$queryRaw`
        SELECT ts.raw_account_id, MIN(ts.timestamp) AS timestamp
        FROM "TransactionStaging" ts
        WHERE NOT EXISTS (
          SELECT *
          FROM "TzAccount" tz
          WHERE tz.address = ts.raw_account_id
        )
        GROUP BY ts.raw_account_id;
      `;

      // construct and create owners
      const constructedOwners = missingAccounts.map((acc) => ({
        parent_address: acc.raw_account_id,
        first_seen: acc.timestamp,
      }));
      newTzAccountOwners = await prisma.tzAccountOwner.createMany({
        data: constructedOwners,
      });

      // Retrieve the newly created owners
      const newOwners = await prisma.tzAccountOwner.findMany({
        orderBy: { id: "desc" },
        take: newTzAccountOwners.count,
      });

      // construct and create accounts
      const constructedAccounts = newOwners.map((owner) => ({
        address: owner.parent_address,
        owner_id: owner.id,
      }));
      newTzAccounts = await prisma.tzAccount.createMany({
        data: constructedAccounts,
      });
    });

    return {
      newTzAccountOwners: newTzAccountOwners.count,
      newTzAccounts: newTzAccounts.count,
    };
  } catch (error) {
    console.error(error);
  }
};

const addNewCollections = async () => {
  try {
    const newCollections = await prisma.$executeRaw`
      INSERT INTO "Collection" (id)
      SELECT ts.collection_id
      FROM "TransactionStaging" ts
      WHERE NOT EXISTS (
        SELECT 1
        FROM "Collection" coll
        WHERE coll.id = ts.collection_id
      )
      ON CONFLICT (id) DO NOTHING;
    `;

    return newCollections;
  } catch (error) {
    console.error(error);
  }
};

const addNewNfts = async () => {
  /**
   * Only new NFTs in primary purchases are added.
   * NFTs with no primary purchase are never added to the database
   * They would create bad results
   * But their omission simply leads to a small number of NFTs not being
   * considered.
   */

  try {
    const newNfts = await prisma.$executeRaw`
      INSERT INTO "Nft" (id, collection_id)
      SELECT ts.fx_nft_id, ts.collection_id
      FROM "TransactionStaging" ts
      WHERE NOT EXISTS (
        SELECT 1
        FROM "Nft" nft
        WHERE nft.id = ts.fx_nft_id
      )
      AND ts.transaction_type = ${TRANSACTION_TYPES.PRIMARY_PURCHASE}
      ON CONFLICT (id) DO NOTHING;
    `;
    return newNfts; // new nft count
  } catch (error) {
    console.error(error);
  }
};

const removeTransactionsWithUnmatchedNfts = async () => {
  try {
    // Remove any transactions with no matching Nft
    // (All NFTs in this batch will have been added)
    // These are transactions where no primary transaction exists in the
    // teztok data, and hence can't be used for the analysis

    const transactionsRemoved = await prisma.$executeRaw`
      DELETE FROM "TransactionStaging" ts
      WHERE NOT EXISTS (
        SELECT 1
        FROM "Nft" nft
        WHERE nft.id = ts.fx_nft_id
      );
    `;
    return transactionsRemoved;
  } catch (error) {
    console.error(error);
  }
};

const calcScoresAndAddTransactions = async (mostRecentTimestamp) => {
  /**
   * Principle is to ensure that scores are always calculated before transactions
   * are added (and that scores for a transaction will never change).
   * Score calculation is tricky due to need to compare with the most recent
   * transaction for that Nft.
   * Process is made more complicated by the most recent purchase often being in
   * the staging table itself. Stages are:
   * Stage 1a - process transactions with an earlier purchase in the staging
   *            table, storing details in an array
   * Stage 1b - remove these transactions from staging table
   * Stage 2a - process transactions with an earlier purchase in the database,
   *            adding them to the array
   * Stage 2b - remove these transactions from staging table
   * Stage 3a - process primary purchases, storing details in an array
   * Stage 4  - check have all transactions
   * Stage 5  - calculate scores for all transactions
   * Stage 6  - add them to the Purchase or Listing tables as appropriate
   */

  try {
    let newTransactions = [];

    // use to check every transaction is processed correctly
    const numberOfStagedTransactions = await prisma.transactionStaging.count();
    console.log(
      `Staged transactions at start of add transact phase: ${numberOfStagedTransactions}`
    );

    // Stage 1a - process transactions with an earlier purchase in the staging table, storing details in an array

    const inStagingTransactions = await prisma.$queryRaw`
      SELECT 
        ts1.id,
        acc.id AS account_id,
        ts1.fx_nft_id AS nft_id,
        ts1.timestamp,
        ts1.price_tz,
        -- ts2.id AS earlier_transaction_id,
        ts2.timestamp AS most_recent_purchase_timestamp,
        -- ts2.transaction_type as earlier_transaction_type,
        ts2.price_tz as most_recent_purchase_price_tz
      FROM "TransactionStaging" ts1
      INNER JOIN "TzAccount" acc on ts1.raw_account_id  = acc.address
      INNER JOIN LATERAL ( --seems similar to a correlated subquery
        SELECT 
          ts2.id,
          ts2.timestamp,
          -- ts2.transaction_type,
          ts2.price_tz
        FROM "TransactionStaging" ts2
        WHERE ts2.fx_nft_id = ts1.fx_nft_id 
          AND ts2.timestamp < ts1.timestamp
          and ts2.transaction_type in ('primary_purchase','secondary_purchase')
        ORDER BY ts2.timestamp DESC
        LIMIT 1
      ) ts2 ON true
      ORDER BY ts1.fx_nft_id, ts1.timestamp;
    `;

    // if (inStagingTransactions.length > 0) {
    //   // CONSOLE DURING DEV
    //   console.log(
    //     "Transactions with earlier purchases in staging:",
    //     inStagingTransactions
    //   );
    //   // throw new Error("TEMPORARY STOP");
    // }

    // Stage 1b - remove these transactions from staging table
    const inStagingRemoveArray = inStagingTransactions.map((ele) => ele.id);

    const removedInStagingTransactions =
      await prisma.transactionStaging.deleteMany({
        where: {
          id: {
            in: inStagingRemoveArray,
          },
        },
      });

    const numberOfStagedTransactions2 = await prisma.transactionStaging.count();
    console.log(
      `InStaging transactions removed: ${removedInStagingTransactions.count}. Remaining : ${numberOfStagedTransactions2}`
    );

    // store ready for processing
    const constructedInStagingTransactions = inStagingTransactions.map(
      (trans) => ({ ...trans, score: 0 })
    );
    newTransactions = constructedInStagingTransactions;

    // Stage 2a - process transactions with an earlier purchase in the database, adding them to the array

    // TO CHECK
    // AND ASSUME COMPUTATIONALLY TOO COMPLEX

    const inDbTransactions = await prisma.$queryRaw`
      SELECT 
        ts.id,
        acc.id AS account_id,
        ts.fx_nft_id as nft_id,
        ts.transaction_type,
        ts.timestamp,
        ts.price_tz,
        -- p.id AS earlier_transaction_id,
        p.timestamp AS most_recent_purchase_timestamp,
        -- p.transaction_type as earlier_transaction_type,
        p.price_tz as most_recent_purchase_price_tz
      FROM "TransactionStaging" ts
      INNER JOIN "TzAccount" acc on ts.raw_account_id  = acc.address
      INNER JOIN LATERAL ( --seems similar to a correlated subquery
        SELECT 
          p.id,
          p.timestamp,
          -- p.transaction_type,
          p.price_tz
        FROM "Purchase" p
        WHERE p.nft_id = ts.fx_nft_id 
          AND p.timestamp < ts.timestamp
          and p.transaction_type in ('primary_purchase','secondary_purchase')
        ORDER BY p.timestamp DESC
        LIMIT 1
      ) p ON true
      ORDER BY ts.fx_nft_id, p.timestamp;
    `;

    // if (inDbTransactions.length > 0) {
    //   // CONSOLE DURING DEV
    //   console.log(
    //     "Transactions with earlier purchases in db:",
    //     inDbTransactions
    //   );
    //   // throw new Error("STOP ON REQUIRED BATCH");
    // }

    // Stage 2b - remove these transactions from staging table
    const inDbRemoveArray = inDbTransactions.map((ele) => ele.id);
    const removedInDbTransactions = await prisma.transactionStaging.deleteMany({
      where: {
        id: {
          in: inDbRemoveArray,
        },
      },
    });
    // console.log("removedInDbTransactions", removedInDbTransactions.count);
    const numberOfStagedTransactions3 = await prisma.transactionStaging.count();
    console.log(
      `InDb transactions removed: ${removedInDbTransactions.count}. Remaining : ${numberOfStagedTransactions3}`
    );

    // store ready for processing
    const constructedInDbTransactions = inDbTransactions.map((trans) => ({
      ...trans,
      score: 0,
    }));
    newTransactions = [...newTransactions, ...constructedInDbTransactions];

    // Stage 3a - process primary purchases, storing details in an array

    const primaryPurchases = await prisma.$queryRaw`
    SELECT
      ts.id, 
      ts.transaction_type, 
      ts.fx_nft_id AS nft_id, 
      acc.id AS account_id, 
      ts.price_tz, 
      ts.timestamp 
    FROM "TransactionStaging" ts
    INNER JOIN "TzAccount" acc ON ts.raw_account_id = acc.address -- accounts will always exist
    WHERE ts.transaction_type = ${TRANSACTION_TYPES.PRIMARY_PURCHASE};
  `;

    // construct and store details in array
    const constructedPrimaryPurchases = primaryPurchases.map((transaction) => ({
      ...transaction,
      most_recent_purchase_timestamp: null,
      most_recent_purchase_price_tz: null,
      score: 0,
    }));

    newTransactions = [...newTransactions, ...constructedPrimaryPurchases];

    // Stage 4  - check have all transactions

    console.log(`Expected: ${numberOfStagedTransactions}`);
    console.log(
      `Constructed ${newTransactions.length} - inStaging ${inStagingTransactions.length}, inDb ${inDbTransactions.length},  primary ${constructedPrimaryPurchases.length}`
    );

    if (newTransactions.length !== numberOfStagedTransactions) {
      console.error(
        "NUMBER OF TRANSACTIONS READY TO SCORE DOES NOT MATCH TRANSACTIONS IN STAGING TABLE"
      );
      throw new Error(
        "NUMBER OF TRANSACTIONS READY TO SCORE DOES NOT MATCH TRANSACTIONS IN STAGING TABLE"
      );
    }

    // * Stage 5  - calculate scores for all transactions
    newTransactions.forEach((trans) => {
      const isGood =
        trans.transaction_type === TRANSACTION_TYPES.LISTING ? false : true;
      trans.score = calcAAIScore(
        trans.most_recent_purchase_price_tz,
        trans.most_recent_purchase_timestamp,
        trans.timestamp,
        isGood
      );
    });

    // * Stage 6  - add newTransactions array to the Purchase or Listing tables as appropriate
    const newPurchases = newTransactions.filter(
      (trans) =>
        trans.transaction_type === TRANSACTION_TYPES.PRIMARY_PURCHASE ||
        trans.transaction_type === TRANSACTION_TYPES.SECONDARY_PURCHASE
    );
    const newListings = newTransactions.filter(
      (trans) =>
        trans.transaction_type === TRANSACTION_TYPES.LISTING ||
        trans.transaction_type === TRANSACTION_TYPES.DELISTING
    );

    // remove superfluous properties
    const finalPurchasesArray = newPurchases.map(
      ({
        most_recent_purchase_price_tz,
        most_recent_purchase_timestamp,
        ...rest
      }) => rest
    );
    const finalListingsArray = newListings.map(
      ({
        most_recent_purchase_price_tz,
        most_recent_purchase_timestamp,
        price_tz,
        ...rest
      }) => rest
    );

    const newPurchaseAdds = await prisma.purchase.createMany({
      data: finalPurchasesArray,
    });
    const newListingAdds = await prisma.listing.createMany({
      data: finalListingsArray,
    });

    const newPurchaseCount = newPurchaseAdds.count;
    const newListingCount = newListingAdds.count;

    console.log("newPurchaseCount", newPurchaseCount);
    console.log("newListingCount", newListingCount);

    return { newPurchaseCount, newListingCount };

    // await calculateStagingTableScores();
  } catch (error) {
    console.error(error);
  }
};

module.exports = loadStage;
