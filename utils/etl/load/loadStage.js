/**
 * Note, the contents here include significant Transform with the Load stage
 */

const prisma = require("../../../config/prismaClient");
const calcAAIScore = require("../transform/aaiScore");
const { TRANSACTION_TYPES } = require("../../../constants/fxhashConstants");

const loadStage = async (transactions) => {
  let batchFullyProcessed = false;

  // Stage 1: Load transactions into TransactionStaging table, and add usd prices
  await truncateTransactionStagingTable();
  await addTransactionsToStaging(transactions);
  await addUsdPrices();

  /**
   * Stage 2: Where owners, accounts, artists, collections, NFTs are seen for
   * the first time in the TransactionStaging table, add them to the database.
   *
   * Note, any repeat of this process for the same transactions will do no harm
   * as it will just identify no new elements.
   */

  const {
    newTzAccountOwners,
    newTzAccounts,
    newCollections,
    newNfts,
    newArtists,
  } = await addNewElements();

  console.log(
    `Added TzAccountOwners: ${newTzAccountOwners}, TzAccounts: ${newTzAccounts}, Collections: ${newCollections}, NFTs: ${newNfts}, Artists: ${newArtists}`
  );

  /**
   * Remove transactions with NFTs that do not exist in the database.
   * This effectively permanently ignores specific NFTs that have no
   * identifiable primary purhcase in the teztok database.
   */
  const newTransactionsRemoved = await removeTransactionsWithUnmatchedNfts();

  // optional stop during dev stage, delete on completion
  await devStop();

  /**
   * Stage 3: Add the transactions to the database.
   *
   * Note, this stage should not be repeated for the same transactions,
   * so changes are carried out as a postgres transaction.
   */
  const { newPurchaseCount, newListingCount } = await addTransactionsToDb();

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
    throw new Error("ERROR IN TRUNCATETRANSACTIONSTAGINGTABLE. INVESTIGATE");
  }
};

const addTransactionsToStaging = async (transactions) => {
  try {
    await prisma.transactionStaging.createMany({
      data: transactions,
    });
  } catch (error) {
    throw new Error("ERROR IN ADDTRANSACTIONSTOSTAGING. INVESTIGATE");
  }
};

const addUsdPrices = async () => {
  try {
    await prisma.$executeRaw`
      update "TransactionStaging" ts
      set price_usd = ts.price_tz * tcr.rate
      from "TezosCurrencyRate" tcr
      where cast(ts.timestamp as DATE) = tcr.date;
    `;
  } catch (error) {
    throw new Error("ERROR IN addUsdPrices. INVESTIGATE");
  }
};

const addNewElements = async () => {
  const { newTzAccountOwners, newTzAccounts } = await addNewOwnersAndAccounts();

  const newArtists = await addNewArtists();

  const newCollections = await addNewCollections();

  const newNfts = await addNewNfts();

  return {
    newTzAccountOwners,
    newTzAccounts,
    newCollections,
    newNfts,
    newArtists,
  };
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
    throw new Error("ERROR IN ADDNEWOWNERSANDARTISTS. INVESTIGATE");
  }
};

const addNewArtists = async () => {
  try {
    // note this approach assumes multiple aliases can't exist for an address
    // (otherwise would have to use group by)
    const newArtists = await prisma.$executeRaw`
      INSERT INTO "Artist" (address, alias)
      SELECT DISTINCT ts.artist_address, ts.artist_alias
      FROM "TransactionStaging" ts
      LEFT JOIN "Artist" art ON ts.artist_address = art.address
      WHERE art.address IS null
      AND ts.transaction_type = ${TRANSACTION_TYPES.PRIMARY_PURCHASE}
      ON CONFLICT (id) DO NOTHING; -- for artists some data can't be trusted
    `;
    return newArtists;
  } catch (error) {
    console.error(error);
    throw new Error("ERROR IN ADDNEWARTISTS. INVESTIGATE");
  }
};

const addNewCollections = async () => {
  try {
    const newCollections = await prisma.$executeRaw`
      INSERT INTO "Collection" (artist_id, id, name, editions, thumbnail)
      SELECT distinct art.id, ts.collection_id, ts.collection_name, ts.collection_editions as collection_editions, ts.collection_thumbnail
      FROM "TransactionStaging" ts
      INNER JOIN "Artist" art on ts.artist_address = art.address -- artist will exist in both
      LEFT JOIN "Collection" coll ON ts.collection_id = coll.id -- left join, looking for no collection in coll
      WHERE coll.id IS null
      AND ts.transaction_type = ${TRANSACTION_TYPES.PRIMARY_PURCHASE}
      ON CONFLICT (id) DO NOTHING; -- for artists some data can't be trusted
    `;
    return newCollections;
  } catch (error) {
    console.error(error);
    throw new Error("ERROR IN ADDNEWCOLLECTIONS. INVESTIGATE");
  }
};

const addNewNfts = async () => {
  /**
   * Only new NFTs in primary purchases are added.
   * NFTs with no primary purchase are never added to the database
   * as they would create AAI scores that don't make any sense
   * NFT omission leads to a small number of NFTs not being considered,
   * which is an acceptable loss (c.1000 of multiple million transactions ).
   */

  try {
    const newNfts = await prisma.$executeRaw`
      INSERT INTO "Nft" (id, mint_year, mint_month, thumbnail, collection_id, collection_iteration)
      SELECT ts.fx_nft_id, ts.nft_mint_year, ts.nft_mint_month, ts.nft_thumbnail, ts.collection_id, ts.collection_iteration
      FROM "TransactionStaging" ts
      WHERE NOT EXISTS (
        SELECT 1
        FROM "Nft" nft
        WHERE nft.id = ts.fx_nft_id
      )
      AND ts.transaction_type = ${TRANSACTION_TYPES.PRIMARY_PURCHASE}
      ON CONFLICT (id) DO NOTHING; -- for artists some data can't be trusted
    `;
    return newNfts; // returns count
  } catch (error) {
    console.error(error);
    throw new Error("ERROR IN ADDNEWNFTS. INVESTIGATE");
  }
};

const removeTransactionsWithUnmatchedNfts = async () => {
  try {
    /**
     * Removes any transactions for NFTs that do not exist in the database.
     * This should only be called after new NFTs have been added.
     *
     * In practice, this happens when no primary purchase transaction exists
     * in the teztok database (caused by early batch mint transactions).
     */

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
    throw new Error(
      "ERROR IN REMOVETRANSACTIONSWITHUNMATCHEDNFTS. INVESTIGATE"
    );
  }
};

const devStop = async () => {
  /**
   * Adding in timestamp stop criteria for dev only, delete for prod
   * Get first timestamp in TransactionStaging table
   */
  // const missingAccounts = await prisma.$queryRaw`
  //   select * from "TransactionStaging" ts
  //   order by "timestamp" desc
  //   limit 1;
  // `;
  // console.log("CHECK", missingAccounts[0].timestamp);
  // const compareDate = new Date("2021-11-12T13:40:00.000Z");
  // if (missingAccounts[0].timestamp > compareDate) {
  //   throw new Error("Planned stop before processing transactions");
  // }
};

const addTransactionsToDb = async () => {
  /**
   * Principle is to ensure that scores are always calculated before transactions
   * are added, and that scores for a transaction will never change.
   * Chosen process takes account of scoring mechanism, and the fact that
   * the score for listings depends on the most recent purchase of the same NFT.
   *
   * Stage 1a - process all purchases - primary and secondary - extracting them
   *            to an array, calculating their AAIScore, then adding them to
   *            the database.
   * Stage 1b - remove purchases from the staging table
   * Stage 2 -  process all remaining transactions (listings) now that any
   *            prior purchase must be in the database - again extract them to
   *            an array, calculate their AAIScore, and add them to the db.
   */

  try {
    // log some numbers to check all transactions in staging table are considered
    const numberOfStagedTransactions = await prisma.transactionStaging.count();
    console.log(
      `Staged transactions at start of add transact phase: ${numberOfStagedTransactions}`
    );
    let newPurchaseCount = 0;
    let newListingCount = 0;

    // Stage 1a - process all purchases

    /**
     * Batch mints were possible in the very early days. Teztok does not process
     * these correctly, giving each mint in the batch the first token_id.
     * Therefore must ignore all but the first mint, from which point these
     * NFTs will be omitted from the dataset permanently, given that they are
     * inserted at primary_purchase only.
     *
     * Query therefore takes unique instances of timestamp, nft_id and
     * transaction_type ('primary_purchase' or 'secondary_purchase' at this stage).
     * Any duplicates are therefore ignored from this point.
     */

    // throw new Error("STOP TO TEST TRANSACTIONSTAGING TABLE");

    const purchases = await prisma.$queryRaw`
      SELECT DISTINCT ON (ts.timestamp, ts.fx_nft_id, ts.transaction_type)
        ts.id, 
        ts.transaction_type, 
        ts.fx_nft_id AS nft_id, 
        acc.id AS account_id, 
        ts.price_tz, 
        ts.price_usd,
        ts.timestamp
      FROM "TransactionStaging" ts
      INNER JOIN "TzAccount" acc ON ts.raw_account_id = acc.address
      WHERE ts.transaction_type in (${TRANSACTION_TYPES.PRIMARY_PURCHASE},${TRANSACTION_TYPES.SECONDARY_PURCHASE})
      ORDER BY ts.timestamp, ts.fx_nft_id, ts.transaction_type, ts.timestamp;
    `;

    // create a score property and calculate scores
    let constructedPurchases = purchases.map((transaction) => ({
      ...transaction,
      score: 0,
    }));

    constructedPurchases.forEach((trans) => {
      const { normalisedScore, priceInfluencedScore } = calcAAIScore(
        trans.price_usd, // this transaction price
        trans.timestamp, // this transaction timestamp
        trans.transaction_type,
        trans.timestamp
      );
      trans.normalised_score = normalisedScore;
      trans.score = priceInfluencedScore;
    });

    const newPurchaseAdds = await prisma.purchase.createMany({
      data: constructedPurchases,
    });

    /**
     *  Stage 1b - remove purchases from the staging table
     *  Note, purchases array is not appropriate as it is only distinct cases.
     *  Need to remove all purchases.
     */
    await prisma.transactionStaging.deleteMany({
      where: {
        transaction_type: {
          in: [
            TRANSACTION_TYPES.PRIMARY_PURCHASE,
            TRANSACTION_TYPES.SECONDARY_PURCHASE,
          ],
        },
      },
    });

    /**
     * Stage 2 - process all remaining transactions - listings
     * Note, this is the heaviest db process and may be
     * If it becomes unmanageable, plan B is to add the latest purchase
     * details in the nft table to reference it as required.
     */

    const listings = await prisma.$queryRaw`
      SELECT 
        ts.id,
        acc.id AS account_id,
        ts.fx_nft_id as nft_id,
        ts.transaction_type,
        ts.timestamp,
        -- ts.price_tz,
        ts.price_usd,
        p.timestamp AS most_recent_purchase_timestamp,
        p.price_usd as most_recent_purchase_price_usd
      FROM "TransactionStaging" ts
      INNER JOIN "TzAccount" acc on ts.raw_account_id  = acc.address
      INNER JOIN LATERAL ( -- similar to a correlated subquery
        SELECT 
          p.id,
          p.timestamp,
          p.price_usd
        FROM "Purchase" p
        WHERE p.nft_id = ts.fx_nft_id 
          AND p.timestamp < ts.timestamp
          and p.transaction_type in ('primary_purchase','secondary_purchase')
        ORDER BY p.timestamp DESC
        LIMIT 1
      ) p ON true
      ORDER BY ts.fx_nft_id, p.timestamp;
    `;

    // create a score property and calculate scores
    let constructedListings = listings.map((trans) => ({
      ...trans,
      score: 0,
    }));

    constructedListings.forEach((trans) => {
      const { normalisedScore, priceInfluencedScore } = calcAAIScore(
        trans.most_recent_purchase_price_usd,
        trans.most_recent_purchase_timestamp,
        trans.transaction_type,
        trans.timestamp
      );
      trans.normalised_score = normalisedScore;
      trans.score = priceInfluencedScore;
    });

    // remove superfluous properties
    constructedListings = constructedListings.map(
      ({
        most_recent_purchase_price_usd,
        most_recent_purchase_timestamp,
        price_usd,
        ...rest
      }) => rest
    );

    const newListingAdds = await prisma.listing.createMany({
      data: constructedListings,
    });

    newPurchaseCount = newPurchaseAdds.count;
    newListingCount = newListingAdds.count;

    return { newPurchaseCount, newListingCount };
  } catch (error) {
    console.error(error);
    throw new Error("ERROR IN ADDTRANSACTIONSTODB. INVESTIGATE");
  }
};

module.exports = loadStage;
