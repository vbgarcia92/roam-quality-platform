export interface Destination {
  id: string;
  country: string;
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
  destinationId: string;
  departureCountry: string;
  departureDate: string;
  arrivalDate: string;
  adults: number;
  children: number;
  traveler: TravelerInfo;
}

export interface Booking {
  id: string;
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
