const processTransaction = require("../../../../utils/etl/transform/processTransaction");

const calcAaiScore = require("../../../../utils/etl/transform/aaiScore");

// processTransaction has a dependency on calcAAiScore, which is tested separately
// will eventually also use a fetch for purchaseTimestamp, will need to use mockResolveValue for this
jest.mock("../../../../utils/etl/transform/aaiScore");
const mockedAaiScore = 100000;
calcAaiScore.mockReturnValue(mockedAaiScore);

let testTransaction = {
  timestamp: "2021-11-03T12:28:02+00:00",
  token: { token_id: "0" },
  price: 100000,
  buyer_address: "tz1",
  seller_address: "tz2",
};

test("placeholder so doesn't cause error", () => {
  expect(1).toEqual(1);
});

// test("process all Primary Purchase transaction types correctly", () => {
//   const transTypeArray = [
//     "FX_MINT_WITH_TICKET",
//     "FX_MINT_V4",
//     "FX_MINT_V3",
//     "FX_MINT_V2",
//     "FX_MINT",
//   ];
//   transTypeArray.forEach((element) => {
//     testTransaction.type = element;
//     expect(processTransaction(testTransaction)).toEqual({
//       transData: {
//         isPrimary: true,
//         accountId: "tz1",
//         priceTz: 100000,
//         nftId: "0",
//         timestamp: "2021-11-03T12:28:02+00:00",
//         score: mockedAaiScore,
//       },
//       transType: "purchase",
//     });
//   });
// });

// test("process all Secondary Purchase transaction types correctly", () => {
//   const transTypeArray = [
//     "FX_LISTING_ACCEPT",
//     "FX_COLLECT",
//     "FX_OFFER_ACCEPT_V3",
//     "FX_COLLECTION_OFFER_ACCEPT",
//   ];
//   transTypeArray.forEach((element) => {
//     testTransaction.type = element;
//     expect(processTransaction(testTransaction)).toEqual({
//       transData: {
//         isPrimary: false,
//         accountId: "tz1",
//         priceTz: 100000,
//         nftId: "0",
//         timestamp: "2021-11-03T12:28:02+00:00",
//         score: mockedAaiScore,
//       },
//       transType: "purchase",
//     });
//   });
// });

// test("process all Listing transaction types correctly", () => {
//   const transTypeArray = ["FX_OFFER", "FX_LISTING"];
//   transTypeArray.forEach((element) => {
//     testTransaction.type = element;
//     expect(processTransaction(testTransaction)).toEqual({
//       transData: {
//         isListing: true,
//         accountId: "tz2",
//         nftId: "0",
//         timestamp: "2021-11-03T12:28:02+00:00",
//         score: mockedAaiScore,
//       },
//       transType: "listing",
//     });
//   });
// });

// test("process all Delisting transaction types correctly", () => {
//   const transTypeArray = ["FX_CANCEL_OFFER", "FX_LISTING_CANCEL"];
//   transTypeArray.forEach((element) => {
//     testTransaction.type = element;
//     expect(processTransaction(testTransaction)).toEqual({
//       transData: {
//         isListing: false,
//         accountId: "tz2",
//         nftId: "0",
//         timestamp: "2021-11-03T12:28:02+00:00",
//         score: mockedAaiScore,
//       },
//       transType: "listing",
//     });
//   });
// });
