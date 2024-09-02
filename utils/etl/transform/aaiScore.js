/**
 * Score calculation central to the application. Approach is as follows:
 *
 * "Transaction Score" = "Relevant Purchase Price" * "Raw Score"
 *
 * "Relevant Purchase Price (RPP)" is the purchase price for the Nft relevant to the
 *  account that a transaction related to.
 *  - e.g. if an account lists an nft, the RPP is the price that this account most
 *    recently paid for the NFT
 *
 * "Raw Score" for an individual transaction ranges from 1 to -1
 * where 1 represents "all good", -1 represents "all bad"
 *
 *
 */

/**
 * Calculate the score for an Nft transaction that reflects
 * @param {*} score
 * @returns
 */

const calcAAIScore = (
  relevantPurchPrice,
  relevantPurchaseTimestamp,
  currentTransTimestamp,
  isGood
) => {
  // DO THIS MUCH BETTER

  // no previous purchase = primary purchase = max score
  if (relevantPurchaseTimestamp === null) {
    return 100;
  }

  const goodBad = isGood ? 1 : -1;

  // timeDecay reduces from 1 to 0 over a year then, then stops at 0

  const secondsInYear = 60 * 60 * 24 * 365;
  const secondsSincePurchase =
    genUnixTimestamp(currentTransTimestamp) -
    genUnixTimestamp(relevantPurchaseTimestamp);
  const timeDecay = Math.max(
    0,
    (secondsInYear - secondsSincePurchase) / secondsInYear
  );
  // console.log(
  //   `Trans timestamp ${currentTransTimestamp} and, purchase timestamp ${purchaseTimestamp} give time decay of ${timeDecay}`
  // );

  const finalScore = goodBad * relevantPurchPrice * timeDecay;
  return finalScore;
};

/**
 * Return unix timestamp (represents seconds) from a string of the form "2021-11-03T20:51:12+00:00"
 * @param {*} dateString
 * @returns {number} Unix timestamp equivalent
 */
const genUnixTimestamp = (dateString) => {
  const dateObject = new Date(dateString);
  return Math.floor(dateObject.getTime() / 1000);
};

module.exports = calcAAIScore;
