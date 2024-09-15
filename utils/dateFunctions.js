/**
 * Extract month and year from ISO 8601 timestamp
 * @param {*} dateString -- form "2021-11-13T10:01:18+00:00"
 * @returns {{year: number, month: number}}
 */

function extractMonthAndYear(dateString) {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;

  return { year, month };
}

function addXDaysToDate(date, addNum) {
  // Creating new Date object avoids mutating original date
  const newDate = new Date(date);
  newDate.setDate(newDate.getDate() + addNum);
  return newDate;
}

function formatDateToYYYYMMDD(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getStartOfYesterday() {
  const now = new Date();
  const startOfYesterday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - 1
  );

  return startOfYesterday;
}

function getStartOfUTCDay() {
  const now = new Date();

  const startOfDayUTC = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      0,
      0,
      0,
      0 // Set hours, minutes, seconds, and milliseconds to 0
    )
  );
  return startOfDayUTC.toISOString();
}

function differenceInDays(isoDate1, isoDate2) {
  const date1 = new Date(isoDate1);
  const date2 = new Date(isoDate2);

  const differenceInMs = date1 - date2;
  const differenceInDays = Math.floor(differenceInMs / (1000 * 60 * 60 * 24));

  return differenceInDays;
}

module.exports = {
  extractMonthAndYear,
  addXDaysToDate,
  formatDateToYYYYMMDD,
  getStartOfYesterday,
  getStartOfUTCDay,
  differenceInDays,
};
