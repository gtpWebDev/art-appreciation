/**
 * Score calculation central to the application. Approach is as follows:
 *
 * "Transaction Score" = "relevantPurchasePrice" * "baseScore" * "goodBadMultiplier"
 *
 * "relevantPurchasePrice" is the purchase price for the Nft relevant to the
 *  account that the transaction relates to.
 *  - if an account lists or delists an nft, the RPP is the price that this
 *    account most recently paid for the NFT
 *  - if the transaction is a purchase, it is simply the purchase price
 *
 * "baseScore" is a decay function designed to start at 2, reducing to zero over
 * time. To understand the desired effect of this element, it is best to look
 * at an example (we'll assume relevantPurchasePrice 1 for simplicity):
 * - Primary purchase - 1 * base score: 1
 * - Listing a little later: -1 * base score: -1.99 - aggregate score: -0.99
 * - Delisting a few days later: 1 * base score: 1.95 - aggregate score: 0.94
 * - Listing a month later: -1 * base score: -1.75 - aggregate sccore: -0.81
 *
 * The aggregate score alternates within 1 and -1, with 1 representing a
 * collector always having held the nft, and -1 representing a collector having
 * attempted to sell the nft 100% of the time. (This will be explained further
 * in the front-end)
 *
 * "goodBadMultiplier" reflects whether a transaction is positive or negative in
 *  terms of art appreciation - listings are "bad" as they represent a desire to
 *  sell, deliists and purchases are "good"
 *
 */

const { TRANSACTION_TYPES } = require("../../../constants/fxhashConstants");

const { differenceInDays } = require("../../dateFunctions");

const DAYS_IN_YEAR = 365; // no need to adjust for leap years!

/**
 * Calculate the AAI Score for an NFT transaction
 * @param {number} relevantPurchasePrice  - purchase price of most recent purchase of same NFT
 * @param {date} relevantPurchaseTimestamp - timestamp of most recent purchase of same NFT
 * @param {string} currentTransType  - transaction type such as 'primary_purchase'
 * @param {date} currentTransTimestamp - timestamp of current transaction
 * @returns {number} - AAI score
 */

const calcAAIScore = (
  relevantPurchasePrice,
  relevantPurchaseTimestamp,
  currentTransType,
  currentTransTimestamp
) => {
  const daysSinceRelevantPurchase = differenceInDays(
    currentTransTimestamp,
    relevantPurchaseTimestamp
  );

  let baseScore;
  if (
    currentTransType === TRANSACTION_TYPES.PRIMARY_PURCHASE ||
    currentTransType === TRANSACTION_TYPES.SECONDARY_PURCHASE
  ) {
    // Primary or secondary purchases starts a new purchase cycle
    baseScore = 1;
  } else {
    // between -2 and 2, declining as more days pass from relevant purchase
    const multFactor =
      1 - daysSinceRelevantPurchase / DAYS_IN_YEAR > 0
        ? 1 - daysSinceRelevantPurchase / DAYS_IN_YEAR
        : 0;
    baseScore = 2 * multFactor;
  }

  const goodBadMultiplier =
    currentTransType === TRANSACTION_TYPES.LISTING ? -1 : 1;

  const normalisedScore = goodBadMultiplier * baseScore;
  const priceInfluencedScore = normalisedScore * relevantPurchasePrice;

  return { normalisedScore, priceInfluencedScore };
};

/**
 * Return unix timestamp (represents seconds) from a string of the form "2021-11-03T20:51:12+00:00"
 * @param {*} dateString
 * @returns {number} Unix timestamp equivalent
 */
// const genUnixTimestamp = (dateString) => {
//   const dateObject = new Date(dateString);
//   return Math.floor(dateObject.getTime() / 1000);
// };

module.exports = calcAAIScore;
