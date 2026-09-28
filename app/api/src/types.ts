export interface Trip {
  id: string;
  country: string;
  departureDate: string;
  arrivalDate: string;
  pricePerPerson: number;
  currency: string;
}

export interface TravelerInfo {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
}

export interface CreateBookingBody {
  tripId: string;
  departureCountry: string;
  adults: number;
  children: number;
  traveler: TravelerInfo;
}

export interface Booking {
  id: string;
  tripId: string | null;
  userId: string | null;
  destinationId: string;
  destinationCountry: string;
  departureCountry: string;
  departureDate: string;
  arrivalDate: string;
  adults: number;
  children: number;
  travelerFirstName: string;
  travelerLastName: string;
  travelerPhone: string;
  travelerEmail: string;
  pricePerPerson: number;
  totalPrice: number;
  currency: string;
  status: string;
  createdAt: string;
}
