// Fixed locales so rendered text is identical on every machine and in CI.
export function formatMoney(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
}

// Dates are calendar dates (YYYY-MM-DD); format in UTC so they never shift
// by a day in the viewer's time zone.
export function formatDate(isoDate: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${isoDate}T00:00:00Z`));
}

export function nightsBetween(departureDate: string, arrivalDate: string): number {
  return Math.round((Date.parse(arrivalDate) - Date.parse(departureDate)) / 86_400_000);
}
