import { Destination } from "../types";

// Fixed catalogue of bookable destinations. Prices are flat per-adult/child
// figures chosen for this SUT and have no relation to real-world fares.
export const DESTINATIONS: Destination[] = [
  { id: "vietnam", country: "Vietnam", pricePerPerson: 1200, currency: "USD" },
  { id: "japan", country: "Japan", pricePerPerson: 1800, currency: "USD" },
  { id: "korea", country: "Korea", pricePerPerson: 1600, currency: "USD" },
  { id: "new-zealand", country: "New Zealand", pricePerPerson: 2200, currency: "USD" },
  { id: "australia", country: "Australia", pricePerPerson: 2000, currency: "USD" },
  { id: "brazil", country: "Brazil", pricePerPerson: 900, currency: "USD" },
  { id: "argentina", country: "Argentina", pricePerPerson: 950, currency: "USD" },
  { id: "usa", country: "USA", pricePerPerson: 1500, currency: "USD" },
  { id: "netherlands", country: "Netherlands", pricePerPerson: 1300, currency: "USD" },
  { id: "france", country: "France", pricePerPerson: 1400, currency: "USD" },
  { id: "italy", country: "Italy", pricePerPerson: 1350, currency: "USD" },
  { id: "indonesia", country: "Indonesia", pricePerPerson: 1100, currency: "USD" },
];

export function findDestination(id: string): Destination | undefined {
  return DESTINATIONS.find((d) => d.id === id);
}
