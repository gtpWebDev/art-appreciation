const { formatDateToYYYYMMDD } = require("./dateFunctions");

/**
 * Get exchange rates for each day between startDate and endDate
 * @param {string} startDateString - expected format "2021-12-05"
 * @param {string} endDateString - expected format "2021-12-05"
 * @returns {number}
 */

async function getExchangeRatesBetween(startDateString, endDateString) {
  /**
   * End point provides a number of price stats for given intervals, over a time period
   * spanning from a startTime to endTime.
   * We will request 24 hour periods between the startDate and endDate, calculating
   * the average of the open price (array[1]) and  close price (array[4])
   *
   * Note, endpoint only allows 1000 days,, have set it to 500, so it collects up to
   * 500 days per batch
   */

  console.log(`Collecting exchange rate data for ${startDateString} onwards`);

  const startTime = new Date(startDateString).getTime();
  const endTime = new Date(endDateString).getTime();

  const baseUrl = "https://api.binance.com/api/v3/klines";
  const symbol = "XTZUSDT";
  const interval = "1d"; // day interval
  const limit = 500;

  try {
    const response = await fetch(
      `${baseUrl}?symbol=${symbol}&interval=${interval}&startTime=${startTime}&endTime=${endTime}&limit=${limit}`
    );

    const data = await response.json();

    if (data.length === 0) return null; // no data is fine

    // restructure results
    const outputData = data.map((element) => ({
      date: new Date(element[0]),
      rate: (parseFloat(element[1]) + parseFloat(element[4])) / 2,
    }));

    return outputData;
  } catch (error) {
    console.error("Error fetching or processing data:", error);
    return null;
  }
}

module.exports = {
  getExchangeRatesBetween,
};
