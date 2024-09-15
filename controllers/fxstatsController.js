//prisma client, managing the postgres connection
const prisma = require("../config/prismaClient");

const { TRANSACTION_TYPES } = require("../constants/fxhashConstants");

// short form, applying try {} catch(err)
const asyncHandler = require("express-async-handler");

// get summary stats for the whole of fxhash
// NEED TO ADD IN SUM TZ AND SUM USD FOR PURCHASES
exports.summary_stats = [
  // no authentication
  // No authorisation middleware

  // Collect and return the counts and sums
  asyncHandler(async (req, res, next) => {
    const [
      artistCount,
      collectionCount,
      nftCount,
      ownerCount,
      accountCount,
      transactionData,
    ] = await Promise.all([
      prisma.artist.count(),
      prisma.collection.count(),
      prisma.nft.count(),
      prisma.tzAccountOwner.count(),
      prisma.tzAccount.count(),
      prisma.transaction.groupBy({
        by: ["transaction_type"],
        _count: {
          id: true,
        },
      }),
    ]);

    // Group by outputs a bit messy
    const primaryPurchaseCount = transactionData.find(
      (purchase) =>
        purchase.transaction_type === TRANSACTION_TYPES.PRIMARY_PURCHASE
    )._count.id;
    const secondaryPurchaseCount = transactionData.find(
      (purchase) =>
        purchase.transaction_type === TRANSACTION_TYPES.SECONDARY_PURCHASE
    )._count.id;
    const listingCount = transactionData.find(
      (listing) => listing.transaction_type === TRANSACTION_TYPES.LISTING
    )._count.id;
    const delistingCount = transactionData.find(
      (listing) => listing.transaction_type === TRANSACTION_TYPES.DELISTING
    )._count.id;

    const response = {
      success: true,
      data: {
        artist_count: artistCount,
        collection_count: collectionCount,
        nft_count: nftCount,
        owner_count: ownerCount,
        account_count: accountCount,
        primary_purchase_count: primaryPurchaseCount,
        secondary_purchase_count: secondaryPurchaseCount,
        listing_count: listingCount,
        delisting_count: delistingCount,
      },
    };
    res.status(200).json(response);
  }),
];
