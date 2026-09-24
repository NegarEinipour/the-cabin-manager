// dev-data/data/helper.js
/**
 * Returns a date relative to today
 * @param {number} days - Number of days from today (negative for past, positive for future)
 * @param {boolean} subtractTime - Whether to subtract time to get a clean date
 * @returns {Date} - A Date object
 */
const fromToday = (days, subtractTime = false) => {
  const date = new Date();

  // Add/subtract days
  date.setDate(date.getDate() + days);

  // If subtractTime is true, set time to 00:00:00
  if (subtractTime) {
    date.setHours(0, 0, 0, 0);
  }

  return date;
};

module.exports = { fromToday };
