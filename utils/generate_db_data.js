const {
  collateQueryResults,
  teztok_FxhashActivityOnDate,
} = require("./teztokApi/teztokQueries");
const { FIRST_FXHASH_DAY } = require("../constants/fxhashConstants");

const testDay = "2021-11-10";
const requestLimit = 1000;

/**
 * Note, how this is done will potentially be slightly different
 * depending on whether it is the historic data load
 * or the ongoing process to maintain a current dataset
 */

async function main() {
  /** Extract stage - collect results for a [calendar day currently]
   *  - Add in progression of the test day
   *  - Add in management of error, to repeat after a delay
   */

  const dayResponse = await collateQueryResults(
    teztok_FxhashActivityOnDate,
    requestLimit,
    testDay
  );
  console.log("Number of results", dayResponse.data.length);

  /** Transform stage
   *  - receives dayResponse: {success:boolean, error: Error, data: object}
   *  - load data into temporary purchase database table and listing database table
   *  - then...
   */

  /** Transform and load stage for Purchases
   *
   *  Primary Purchase and Secondary Purchase almost identical:
   *  - Calculate score as priceTz * 100
   *  - Load into purchases (available to listings)
   */

  /** Tranform and load stage for Listings
   *
   *  Listings and Delistings almost identical:
   *  - Link to Purchases table
   *  - Get highest timestamp that is strictly less than listing/delisting timestamp
   *  - Calculate score as mostRecentPrice * -1 or 1 * fn(mostRecentDate)
   *  - Load into listings
   */
}

main();
