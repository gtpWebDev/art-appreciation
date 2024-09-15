const aaiScore = require("../../../../utils/etl/transform/aaiScore");
const { TRANSACTION_TYPES } = require("../../../../constants/fxhashConstants");

/**
 * need to add in unacceptable inputs
 */

describe("Purchases scores should be equal to the relevant purchase price", () => {
  test("Primary Purchase", () => {
    const relevantPurchasePrice = 10;
    const relevantPurchaseTimestamp = null;
    const currentTransType = TRANSACTION_TYPES.PRIMARY_PURCHASE;
    const currentTransTimestamp = null;

    expect(
      aaiScore(
        relevantPurchasePrice,
        relevantPurchaseTimestamp,
        currentTransType,
        currentTransTimestamp
      )
    ).toEqual({
      normalisedScore: 1,
      priceInfluencedScore: relevantPurchasePrice,
    });
  });

  test("Secondary Purchase", () => {
    const relevantPurchasePrice = 10;
    const relevantPurchaseTimestamp = null;
    const currentTransType = TRANSACTION_TYPES.SECONDARY_PURCHASE;
    const currentTransTimestamp = null;
    expect(
      aaiScore(
        relevantPurchasePrice,
        relevantPurchaseTimestamp,
        currentTransType,
        currentTransTimestamp
      )
    ).toEqual({
      normalisedScore: 1,
      priceInfluencedScore: relevantPurchasePrice,
    });
  });
});

// Note, curve will likely be adjusted, so tests will need to be updated
describe("Scores decline as expected", () => {
  test("Immediate listing approx double negative value of the relevant purchase price", () => {
    const relevantPurchasePrice = 10;
    const relevantPurchaseTimestamp = "2022-01-01T00:00:00Z";
    const currentTransType = "listing";
    const currentTransTimestamp = "2022-01-01T00:30:00Z";

    expect(
      aaiScore(
        relevantPurchasePrice,
        relevantPurchaseTimestamp,
        currentTransType,
        currentTransTimestamp
      ).normalisedScore
    ).toBeCloseTo(-1.999, 2); // to 2 dps
    expect(
      aaiScore(
        relevantPurchasePrice,
        relevantPurchaseTimestamp,
        currentTransType,
        currentTransTimestamp
      ).priceInfluencedScore
    ).toBeCloseTo(-19.999, 2); // to 2 dps
  });

  test("Delisting after 6 months approx value of the relevant purchase price", () => {
    const relevantPurchasePrice = 10;
    const relevantPurchaseTimestamp = "2022-01-01T00:00:00Z";
    const currentTransType = "delisting";
    const currentTransTimestamp = "2022-07-01T00:00:00Z";

    expect(
      aaiScore(
        relevantPurchasePrice,
        relevantPurchaseTimestamp,
        currentTransType,
        currentTransTimestamp
      ).normalisedScore
    ).toBeCloseTo(1, 1); // to 1 dps - between 0.95 and 1.05
    expect(
      aaiScore(
        relevantPurchasePrice,
        relevantPurchaseTimestamp,
        currentTransType,
        currentTransTimestamp
      ).priceInfluencedScore
    ).toBeCloseTo(10, 0); // to 0 dps - between 9.5 and 10.5
  });

  test("listing after almost 12 months almost zero", () => {
    const relevantPurchasePrice = 10;
    const relevantPurchaseTimestamp = "2022-01-01T00:00:00Z";
    const currentTransType = "listing";
    const currentTransTimestamp = "2022-12-31T12:00:00Z";

    expect(
      aaiScore(
        relevantPurchasePrice,
        relevantPurchaseTimestamp,
        currentTransType,
        currentTransTimestamp
      ).normalisedScore
    ).toBeCloseTo(-0.01, 1); // to 1 dp, almost zero
    expect(
      aaiScore(
        relevantPurchasePrice,
        relevantPurchaseTimestamp,
        currentTransType,
        currentTransTimestamp
      ).priceInfluencedScore
    ).toBeCloseTo(-0.01, 1); // to 1 dp, almost zero
  });

  test("delisting after slightly over 12 months is zero", () => {
    const relevantPurchasePrice = 10;
    const relevantPurchaseTimestamp = "2022-01-01T00:00:00Z";
    const currentTransType = "delisting";
    const currentTransTimestamp = "2023-01-05T12:00:00Z";

    expect(
      aaiScore(
        relevantPurchasePrice,
        relevantPurchaseTimestamp,
        currentTransType,
        currentTransTimestamp
      )
    ).toEqual({
      normalisedScore: 0,
      priceInfluencedScore: 0,
    });
  });

  test("listing after many years is zero", () => {
    const relevantPurchasePrice = 10;
    const relevantPurchaseTimestamp = "2022-01-01T00:00:00Z";
    const currentTransType = "listing";
    const currentTransTimestamp = "2026-01-05T12:00:00Z";

    expect(
      aaiScore(
        relevantPurchasePrice,
        relevantPurchaseTimestamp,
        currentTransType,
        currentTransTimestamp
      )
    ).toEqual({
      normalisedScore: -0,
      priceInfluencedScore: -0,
    });
  });
});
