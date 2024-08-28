const aaiScore = require("../../../../utils/etl/transform/aaiScore");

// Note, curve will likely be adjusted, so tests will need to be updated
describe("Scores decline as expected", () => {
  test("Transaction time = purchase time outputs purchase price", () => {
    const relevantPurchasePrice = 100000;
    const purchaseTimestamp = "2021-11-03T12:28:02+00:00";
    const transTimestamp = "2021-11-03T12:28:02+00:00";
    const isGood = true;

    expect(
      aaiScore(relevantPurchasePrice, purchaseTimestamp, transTimestamp, isGood)
    ).toBe(relevantPurchasePrice);
  });

  test("Transaction time 6 months after purchase time outputs hald purchase price", () => {
    const relevantPurchasePrice = 100000;
    const purchaseTimestamp = "2021-05-03T12:28:02+00:00";
    const transTimestamp = "2021-11-03T12:28:02+00:00";
    const isGood = true;

    expect(
      aaiScore(relevantPurchasePrice, purchaseTimestamp, transTimestamp, isGood)
    ).toBeCloseTo(50000, -3);
  });

  test("Transaction time a year after purchase time outputs zero", () => {
    const relevantPurchasePrice = 100000;
    const purchaseTimestamp = "2021-11-03T12:28:02+00:00";
    const transTimestamp = "2022-11-03T12:28:02+00:00";
    const isGood = true;

    expect(
      aaiScore(relevantPurchasePrice, purchaseTimestamp, transTimestamp, isGood)
    ).toBe(0);
  });

  test("Transaction time more than a year after purchase time outputs zero", () => {
    const relevantPurchasePrice = 100000;
    const purchaseTimestamp = "2021-11-03T12:28:02+00:00";
    const transTimestamp = "2022-12-03T12:28:02+00:00";
    const isGood = true;

    expect(
      aaiScore(relevantPurchasePrice, purchaseTimestamp, transTimestamp, isGood)
    ).toBe(0);
  });
});
