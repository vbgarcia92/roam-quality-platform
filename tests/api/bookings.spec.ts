import { randomUUID } from "crypto";
import { expect, test } from "@playwright/test";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

// Covers risk R1 (docs/01-quality-strategy-draft.md): the booking must be an
// exact snapshot of the trip, priced as pricePerPerson x travelers.
test("POST /bookings books a trip with a correct price snapshot", async ({ request }) => {
  // Trip ids and dates change on every re-seed, so read them from the SUT.
  const tripsResponse = await request.get("/trips");
  expect(tripsResponse.status()).toBe(200);
  const { trips } = await tripsResponse.json();
  expect(trips.length, "seeded upcoming trips").toBeGreaterThan(0);
  const trip = trips[0];

  const departureCountry = trip.country === "Brazil" ? "Argentina" : "Brazil";
  const email = `api-${randomUUID()}@example.com`;

  const createResponse = await request.post("/bookings", {
    data: {
      tripId: trip.id,
      departureCountry,
      adults: 2,
      children: 1,
      traveler: { firstName: "Api", lastName: "Tester", phone: "+1 415 555 0100", email },
    },
  });
  expect(createResponse.status()).toBe(201);
  const { booking } = await createResponse.json();

  expect(booking.id).toMatch(UUID);
  expect(booking).toMatchObject({
    tripId: trip.id,
    userId: null,
    destinationCountry: trip.country,
    departureCountry,
    departureDate: trip.departureDate,
    arrivalDate: trip.arrivalDate,
    adults: 2,
    children: 1,
    travelerEmail: email,
    pricePerPerson: trip.pricePerPerson,
    totalPrice: trip.pricePerPerson * 3,
    currency: trip.currency,
    status: "CONFIRMED",
  });

  const getResponse = await request.get(`/bookings/${booking.id}`);
  expect(getResponse.status()).toBe(200);
  expect((await getResponse.json()).booking).toEqual(booking);
});
