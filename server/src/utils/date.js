// Normalizes any Date/string to midnight UTC of the same calendar day.
// This keeps one attendance record per employee per day regardless of
// what time of day the check-in request arrives.
function startOfUTCDay(input) {
  const d = input ? new Date(input) : new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function endOfUTCDay(input) {
  const d = startOfUTCDay(input);
  return new Date(d.getTime() + 24 * 60 * 60 * 1000 - 1);
}

module.exports = { startOfUTCDay, endOfUTCDay };
