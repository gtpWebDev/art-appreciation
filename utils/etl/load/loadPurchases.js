const prisma = require("../../../config/prismaClient");

const loadNewPurchases = async (purchases) => {
  // Stage 0: Load new purchases into staging table
  await truncatePurchaseStagingTable();
  await addPurchasesToStaging(purchases);

  const { newTzAccountOwners, newTzAccounts } = await addNewOwnersAndAccounts();

  const newCollections = await addNewCollections();

  const newNfts = await addNewNfts();

  const { newPurchases, purchasesRemoved } = await addPurchases(purchases);

  console.log(
    `Added TzAccountOwners: ${newTzAccountOwners}, TzAccounts: ${newTzAccounts}, Collections: ${newCollections}, NFTs: ${newNfts}, Purchases: ${newPurchases}`
  );

  // tracking number of trans removed due to nfts with no primary sale
  // likely can delete after dev stage
  return purchasesRemoved;
};

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
    let newTzAccountOwners;
    let newTzAccounts;

    await prisma.$transaction(async (prisma) => {
      // transaction ensures new owners and accounts added together

      // Find Buying Accounts not currently in the database
      // outputs array of form: { raw_account_id: 'tz1a2ZeWmyNQ8BiuFNTE4vmFEP9MBaP76QPX' }
      const missingAccounts = await prisma.$queryRaw`
        SELECT ps.raw_account_id, MIN(ps.timestamp) AS timestamp
        FROM "PurchaseStaging" ps
        WHERE NOT EXISTS (
          SELECT *
          FROM "TzAccount" tz
          WHERE tz.address = ps.raw_account_id
        )
        GROUP BY ps.raw_account_id;
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
    SELECT ps.collection_id
    FROM "PurchaseStaging" ps
    WHERE NOT EXISTS (
      SELECT 1
      FROM "Collection" coll
      WHERE coll.id = ps.collection_id
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
   * The meaning of primary and secondary purchases dictates whether the related NFT
   * needs to be added to the database:
   * - Primary purchases - NFTs come into existence so need to be added
   * - Secondary purchases - NFTs will already have been added at primary purchase
   *
   * If the teztok data is not completely correct this approach will need to be amended
   */

  try {
    const newNfts = await prisma.$executeRaw`
      INSERT INTO "Nft" (id, collection_id)
      SELECT ps.fx_nft_id, ps.collection_id
      FROM "PurchaseStaging" ps
      WHERE NOT EXISTS (
        SELECT 1
        FROM "Nft" nft
        WHERE nft.id = ps.fx_nft_id
      )
      AND ps.is_primary = true
      ON CONFLICT (id) DO NOTHING;
    `;
    return newNfts; // new nft count
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
    // Connect Staging data with id from account table

    // Remove non-primary purchases with no matching Nft (after primary
    // have been added). Can't analyse NFTs with no primary purchase

    const purchasesRemoved = await prisma.$executeRaw`
      DELETE FROM "PurchaseStaging" ps
      WHERE ps.is_primary = false
      AND NOT EXISTS (
        SELECT 1
        FROM "Nft" nft
        WHERE nft.id = ps.fx_nft_id
      );
    `;

    // add the purchases
    const newPurchases = await prisma.$executeRaw`
      INSERT INTO "Purchase" (is_primary, nft_id, account_id, price_tz, timestamp, score)
      SELECT ps.is_primary, ps.fx_nft_id, acc.id AS account_id, ps.price_tz, ps.timestamp, 0 AS score FROM "PurchaseStaging" ps
      INNER JOIN "TzAccount" acc
      ON ps.raw_account_id = acc.address;
    `;
    return { newPurchases, purchasesRemoved };
  } catch (error) {
    console.error(error);
  }
};

module.exports = loadNewPurchases;
