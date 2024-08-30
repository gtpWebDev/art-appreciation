const prisma = require("../../../config/prismaClient");

const loadNewListings = async (listings) => {
  /**
   * Again, the process for adding listings is made more efficient
   * by understanding the sequence of transactions and trusting the
   * teztok API which provides the data.
   * Due to the nature of listings, the collections, NFTs and accounts
   * have already been added to the database, so do not need to be checked.
   *
   * Therefore process is limited to staging and loading the listings.
   */

  await truncateListingStagingTable();
  await addListingsToStaging(listings);

  const listingsRemoved = await addListings();

  return listingsRemoved;
};

const truncateListingStagingTable = async () => {
  try {
    await prisma.$executeRaw`TRUNCATE TABLE "ListingStaging";`;
  } catch (error) {
    console.error("Error truncating table:", error);
  }
};

const addListingsToStaging = async (listings) => {
  try {
    await prisma.listingStaging.createMany({
      data: listings,
    });
  } catch (error) {
    console.error("Error moving purchases to staging table", error);
  }
};

const addListings = async () => {
  /**
   * - In theory listings should never include a new Collection or Nft as a
   *   previous purchase will have picked these up. New accounts will be very
   *   rare as this could only happen with people receiving a gift and then
   *   listing.
   * - However, need to deal with any of these exceptional circumstances should
   *   they occur (also possible if data = bad)
   * - Approach is therefore to assume good data but carry out a more thorough
   *   process in the error catch.
   * - This will mean the process isn't heavily slowed down checking for things
   *   that will almost never happen, but that it is 100% robust.
   */

  try {
    // Add listings, assuming all is well
    const newListings = await prisma.$executeRaw`
      INSERT INTO "Listing" (is_listing, nft_id, account_id, timestamp, score)
      SELECT ls.is_listing, nft.id AS nft_id, acc.id AS account_id, ls.timestamp, 0 AS score FROM "ListingStaging" ls
      INNER JOIN "Nft" nft
      ON ls.fx_nft_id = nft.id
      INNER JOIN "TzAccount" acc
      ON ls.raw_account_id = acc.address;
    `;

    console.log(`Added Listings: ${newListings}. No new dependencies.`);

    return 0; // represents no listingsRemoved;
  } catch (error) {
    console.error(error);

    // Special error handling
    const newAdditions = await processDependenciesThenListings();

    console.log(
      `Added TzAccountOwners: ${newAdditions.newTzAccountOwners}, TzAccounts: ${newAdditions.newTzAccounts}, Collections: ${newAdditions.newCollections}, NFTs: ${newAdditions.newNfts}, Listings: ${newAdditions.newListings}`
    );

    // tracking number of trans removed due to nfts with no primary sale
    // likely can delete after dev stage
    return newAdditions.listingsRemoved;
  }
};

const processDependenciesThenListings = async () => {
  /**
   * Runs only on catch error in addListings
   * More through process to add in any new Collections, Nfts and
   * accounts/owners.
   */

  try {
    // ***ACCOUNTS/OWNERS***

    let newTzAccountOwners;
    let newTzAccounts;

    await prisma.$transaction(async (prisma) => {
      // transaction ensures new owners and accounts added together

      // Find Buying Accounts not currently in the database
      // outputs array of form: { raw_account_id: 'tz1a2ZeWmyNQ8BiuFNTE4vmFEP9MBaP76QPX' }
      const missingAccounts = await prisma.$queryRaw`
        SELECT ps.raw_account_id, MIN(ps.timestamp) AS timestamp
        FROM "ListingStaging" ps
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

    // ***COLLECTIONS***

    const newCollections = await prisma.$executeRaw`
      INSERT INTO "Collection" (id)
      SELECT ps.collection_id
      FROM "ListingStaging" ps
      WHERE NOT EXISTS (
        SELECT 1
        FROM "Collection" coll
        WHERE coll.id = ps.collection_id
      )
      ON CONFLICT (id) DO NOTHING;
    `;

    // ***NFTS*** - MISSING NFTs NOT ADDED AS WE DON'T WANT NFTs
    // WITHOUT PRIMARY PURCHASES (REF1)

    // ***LISTINGS***
    // REMOVE THOSE WITH NO MATCHING NFT
    // ADD REDUCED LISTINGS TABLE

    const listingsRemoved = await prisma.$executeRaw`
      DELETE FROM "ListingStaging" ps
      WHERE NOT EXISTS (
        SELECT 1
        FROM "Nft" nft
        WHERE nft.id = ps.fx_nft_id
      );
    `;

    const newListings = await prisma.$executeRaw`
      INSERT INTO "Listing" (is_listing, nft_id, account_id, timestamp, score)
      SELECT ls.is_listing, nft.id AS nft_id, acc.id AS account_id, ls.timestamp, 0 AS score FROM "ListingStaging" ls
      INNER JOIN "Nft" nft
      ON ls.fx_nft_id = nft.id
      INNER JOIN "TzAccount" acc
      ON ls.raw_account_id = acc.address;
    `;

    return {
      newTzAccountOwners: newTzAccountOwners.count,
      newTzAccounts: newTzAccounts.count,
      newCollections: newCollections,
      newNfts: newNfts,
      newListings: newListings,
      listingsRemoved: listingsRemoved,
    };
  } catch (error) {
    console.error(error);
  }
};

module.exports = loadNewListings;
