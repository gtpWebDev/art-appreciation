const calcAAIScore = require("./aaiScore");

const { TRANSACTION_TYPES } = require("../../../constants/fxhashConstants");

/**
 * Process a single transaction into the form required by the Postgres model
 * @param {*} transaction - transaction object originating from teztok
 * @returns {{ transData: object[], transType: string }}
 */

const processTransaction = (transaction) => {
  try {
    // if (transaction.token.fx_issuer_id === null) {
    //   throw new Error("No colelction id");
    // }

    let transData = {};
    let transType = "";
    let isPrimary = false;
    let isListing = false;
    let isPurchase = false;

    switch (transaction.type) {
      //purchases
      case "FX_MINT_WITH_TICKET":
      case "FX_MINT_V4":
      case "FX_MINT_V3":
      case "FX_MINT_V2":
      case "FX_MINT":
        isPrimary = true;
      case "FX_LISTING_ACCEPT":
      case "FX_COLLECT":
      case "FX_OFFER_ACCEPT_V3":
      case "FX_COLLECTION_OFFER_ACCEPT":
        isPurchase = true; // isPrimary remains false
        break;
      // end of purchases

      // listings
      case "FX_OFFER":
      case "FX_LISTING":
        isListing = true; // isPurchase remains false
      case "FX_CANCEL_OFFER":
      case "FX_LISTING_CANCEL":
        // isListing and isPurchase remains false
        break;
      // end of listings
    }

    if (isPurchase) {
      transData = {
        is_primary: isPrimary,
        raw_account_id: transaction.buyer_address,
        price_tz: transaction.price,
        // update score when have final score function
        // score: transaction.price, // score approach tuned to give price at purchase
      };
    } else {
      transData = {
        is_listing: isListing,
        raw_account_id: transaction.seller_address,
      };
    }

    transData.fx_nft_id = generateUniqueNftId(
      transaction.token.fa2_address,
      transaction.token.token_id
    );
    // assign dummy collection id if not available
    // nft is assigned collection_id the first time it is seen
    // impacts collection_id analysis only
    // will not cause any fundamental data integrity issues
    transData.collection_id = transaction.token.fx_issuer_id || 999999;

    transData.timestamp = transaction.timestamp;
    transType = isPurchase
      ? TRANSACTION_TYPES.PURCHASE
      : TRANSACTION_TYPES.LISTING;

    return { success: true, transData, transType };
  } catch (error) {
    return { success: false, transData: null, transType: null };
  }
};

const generateUniqueNftId = (fa2Address, tokenId) => {
  /**
   * Because token_id was reset to 1 in early 2023, with the introduction
   * of params, it is necessary to generate a unique id from a combination of
   * part of the fa2_address and the token_id:
   * - Beta phase: fa2_address: KT1KEa8z6vWXDJrVqtMrAeDVzsvxat3kHaCE
   * - Fxhash 1.0: fa2_address: KT1U6EHmNxJTkvaWJ4ThczG4FSDaHC21ssvi (April 2022)
   * - Params, not Fxhash 2.0: fa2_address: KT1EfsNuqwLAWDd3o4pvfUx1CAh5GMdTrRvr (March 2023)
   */

  // UNTESTED

  const uniqueNftId = fa2Address.slice(-5) + "_" + tokenId;
  return uniqueNftId;
};

module.exports = processTransaction;
