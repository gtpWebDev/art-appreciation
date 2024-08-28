const calcAAIScore = require("./aaiScore");

const { TRANSACTION_TYPES } = require("../../../constants/fxhashConstants");

/**
 * Process a single transaction into the form required by the Postgres model
 * @param {*} transaction - transaction object originating from teztok
 * @returns {{ transData: object[], transType: string }}
 */

const processTransaction = (transaction) => {
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
      account_id: transaction.seller_address,
    };
  }

  transData.fx_nft_id = transaction.token.token_id;
  transData.collection_id = transaction.token.fx_issuer_id;
  transData.timestamp = transaction.timestamp;
  transType = isPurchase
    ? TRANSACTION_TYPES.PURCHASE
    : TRANSACTION_TYPES.LISTING;

  return { transData, transType };
};

module.exports = processTransaction;
