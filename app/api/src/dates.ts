// The earliest calendar date currently in effect anywhere (UTC-12), as
// YYYY-MM-DD. Used as "today" so a traveler west of UTC isn't told a trip
// leaving today has already departed.
export function earliestCurrentDate(): string {
  return new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString().slice(0, 10);
}
