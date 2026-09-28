export interface Trip {
  id: string;
  country: string;
  departureDate: string;
  arrivalDate: string;
  pricePerPerson: number;
  currency: string;
}

export interface Booking {
  id: string;
  tripId: string;
  destinationCountry: string;
  departureCountry: string;
  departureDate: string;
  arrivalDate: string;
  adults: number;
  children: number;
  travelerFirstName: string;
  travelerLastName: string;
  travelerEmail: string;
  totalPrice: number;
  currency: string;
  status: string;
}

export interface CreateBookingPayload {
  tripId: string;
  departureCountry: string;
  adults: number;
  children: number;
  traveler: { firstName: string; lastName: string; phone: string; email: string };
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly details: string[] = [],
  ) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, init);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(res.status, data.error ?? `Request failed (${res.status})`, data.details ?? []);
  }
  return data as T;
}

export async function getTrips(): Promise<Trip[]> {
  return (await request<{ trips: Trip[] }>("/trips")).trips;
}

export async function getTrip(id: string): Promise<Trip> {
  return (await request<{ trip: Trip }>(`/trips/${encodeURIComponent(id)}`)).trip;
}

export async function createBooking(payload: CreateBookingPayload): Promise<Booking> {
  const data = await request<{ booking: Booking }>("/bookings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return data.booking;
}
