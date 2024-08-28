const prisma = require("../../../config/prismaClient");

const loadNewPurchases = async (purchases) => {
  /**
   * Process for adding purchases is made more efficient by understanding the
   * sequence of transactions and trusting the teztok API which provides the data.
   *
   * Stage 0: Load new purchases into the staging table
   * Stage 1: Identify new TzAccount in the purchases, add them to
   *          TzAccountOwner then TzAccount
   * Stage 2: Identify and add new Collections in the purchases
   * Stage 3: Add Nfts for all primary purchases (Primary always new, secondary always not)
   * Stage 4: Add the purchases
   */

  // Stage 0: Load new purchases into staging table
  await truncatePurchaseStagingTable();
  await addPurchasesToStaging(purchases);

  // Stage 1: Identify new TzAccount in the purchases, add them to
  //          TzAccountOwner then TzAccount

  await addNewOwnersAndAccounts();

  // Stage 2: Identify and add new Collections in the purchases
  await addNewCollections();

  // Stage 3: Add Nfts for all primary purchases (Primary always new, secondary always not)
  await addNewNfts();

  // Stage 4: Add the purchases
  await addPurchases(purchases);
};

// delete when confident
const truncatePurchaseStagingTable = async () => {
  try {
    await prisma.$executeRaw`TRUNCATE TABLE "PurchaseStaging";`;
  } catch (error) {
    console.error("Error truncating table:", error);
  }
};

const addPurchasesToStaging = async (purchases) => {
  try {
    await prisma.purchaseStaging.createMany({
      data: purchases,
    });
  } catch (error) {
    console.error("Error moving purchases to staging table", error);
  }
};

const addNewOwnersAndAccounts = async () => {
  /**
   * TzAccountOwners are a subset of TzAccounts. Need to identify accounts that
   * do not exist in TzAccounts, then can safely assume they exist in neither.
   */

  try {
    // Find Buying Accounts not currently in the database
    const missingAccounts = await prisma.$queryRaw`
      SELECT DISTINCT ps.raw_account_id
      FROM "PurchaseStaging" ps
      WHERE NOT EXISTS (
        SELECT *
        FROM "TzAccount" tz
        WHERE tz.address = ps.raw_account_id
      );
    `;

    // Add missingAccounts to TzAccountOwner table
    const transformedOwners = missingAccounts.map((owner) => ({
      address: owner.raw_account_id,
    }));
    const newTzAccountOwners = await prisma.tzAccountOwner.createMany({
      data: transformedOwners,
    });

    console.log(`TzAccountOwners added: ${newTzAccountOwners.count} `);

    // collect the full owner records to insert them in TzAccount table
    // NOTE THIS IS AN EXTRA STAGE DUE TO NOT USING THE TZ ADDRESS
    const accountArray = missingAccounts.map((acc) => acc.raw_account_id);
    const newOwners = await prisma.tzAccountOwner.findMany({
      where: {
        address: {
          in: accountArray,
        },
      },
    });

    const transformedAccounts = newOwners.map((acc) => ({
      address: acc.address,
      owner_id: acc.id,
    }));

    const newTzAccounts = await prisma.tzAccount.createMany({
      data: transformedAccounts,
    });
    console.log(`TzAccounts added: ${newTzAccounts.count} `);
  } catch (error) {
    console.error(error);
  }
};

const addNewCollections = async () => {
  /**
   * This should be a relatively simple stage
   */

  try {
    // Find Collections not currently in the database
    const missingCollections = await prisma.$queryRaw`
      SELECT DISTINCT ps.collection_id
      FROM "PurchaseStaging" ps
      WHERE NOT EXISTS (
        SELECT *
        FROM "Collection" coll
        WHERE coll.id = ps.collection_id
      );
    `;

    // Add missingCollections to Collection table
    const transformedCollections = missingCollections.map((coll) => ({
      id: coll.collection_id,
    }));
    const newCollections = await prisma.collection.createMany({
      data: transformedCollections,
    });

    console.log(`Collections added: ${newCollections.count} `);
  } catch (error) {
    console.error(error);
  }
};

const addNewNfts = async () => {
  /**
   * The meaning of primary and secondary purchases dictates whether the related NFT
   * needs to be added to the database:
   * - Primary purchases - NFTs come into existence so need to be added
   * - Secondary purchases - NFTs will already have been added at primary purchase
   *
   * This is the theory - if the teztok information and my process is not percect
   * then the above approach may lead to NFTs being missed
   */

  try {
    // RawSQL approach used to execute in 1 stage
    const newNfts = await prisma.$executeRaw`
      INSERT INTO "Nft" (fx_nft_id, collection_id)
      SELECT DISTINCT ps.fx_nft_id, ps.collection_id
      FROM "PurchaseStaging" ps;
    `;
    console.log(`Nfts added: ${newNfts}`);
  } catch (error) {
    console.error(error);
  }
};

const addPurchases = async (purchases) => {
  /**
   * Need rawSql to collect the relevant database nft_ids and account_ids
   * Note, this has all been collected earlier in the process,
   * an alternative would be to retain the raw_nft_id / nft_id link and use it here
   *  - benefit of this is that there has been no lookup on a potentially 1m+ NFT
   * table as yet in the load stage
   *  - in fact there has been no lookup of any of the large datasets - NFT, purch, list
   *
   */

  try {
    // Query to connect in using joins the database nft_id and database account_id
    // Select to collect info from PurchaseStaging and two related tables
    // Insert the result into Purchase table

    await prisma.$queryRaw`
      INSERT INTO "Purchase" (is_primary, nft_id, account_id, price_tz, timestamp, score)
      SELECT ps.is_primary, nft.id AS nft_id, acc.id AS account_id, ps.price_tz, ps.timestamp, 0 AS score FROM "PurchaseStaging" ps
      INNER JOIN "Nft" nft
      ON ps.fx_nft_id = nft.fx_nft_id
      INNER JOIN "TzAccount" acc
      ON ps.raw_account_id = acc.address;
    `;
  } catch (error) {
    console.error(error);
  }
};

module.exports = {
  loadNewPurchases,
};
