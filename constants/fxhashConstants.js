const FIRST_FXHASH_DAY = "2021-11-03";

// mimics an enum
const TRANSACTION_TYPES = Object.freeze({
  PRIMARY_PURCHASE: "primary_purchase",
  SECONDARY_PURCHASE: "secondary_purchase",
  LISTING: "listing",
  DELISTING: "delisting",
});
// const TRANSACTION_TYPES = Object.freeze({
//   PURCHASE: "purchase",
//   LISTING: "listing",
// });

module.exports = {
  FIRST_FXHASH_DAY,
  TRANSACTION_TYPES,
};
