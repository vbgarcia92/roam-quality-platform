import { FastifyInstance } from "fastify";
import { randomUUID } from "crypto";
import { pool } from "../db";
import { earliestCurrentDate } from "../dates";
import { Booking, CreateBookingBody, Trip } from "../types";
import { formatValidationErrors } from "../validation";
import { InvalidTokenError, resolveOptionalUserId } from "../auth/jwt";
import { findTrip } from "./trips";

const MAX_TRAVELERS_PER_TYPE = 10;
const NON_BLANK = "\\S";

const nameSchema = { type: "string", minLength: 1, maxLength: 100, pattern: NON_BLANK } as const;

const createBookingSchema = {
  type: "object",
  additionalProperties: false,
  required: ["tripId", "departureCountry", "adults", "children", "traveler"],
  properties: {
    tripId: { type: "string", format: "uuid" },
    departureCountry: nameSchema,
    adults: { type: "integer", minimum: 1, maximum: MAX_TRAVELERS_PER_TYPE },
    children: { type: "integer", minimum: 0, maximum: MAX_TRAVELERS_PER_TYPE },
    traveler: {
      type: "object",
      additionalProperties: false,
      required: ["firstName", "lastName", "phone", "email"],
      properties: {
        firstName: nameSchema,
        lastName: nameSchema,
        phone: { type: "string", maxLength: 30, pattern: "^[+\\d][\\d\\s\\-()]{6,}$" },
        email: { type: "string", format: "email", maxLength: 254 },
      },
    },
  },
} as const;

const bookingParamsSchema = {
  type: "object",
  required: ["id"],
  properties: { id: { type: "string", format: "uuid" } },
} as const;

function businessRuleErrors(body: CreateBookingBody, trip: Trip): string[] {
  const errors: string[] = [];
  if (trip.departureDate < earliestCurrentDate()) {
    errors.push("trip has already departed");
  }
  if (body.departureCountry.trim().toLowerCase() === trip.country.toLowerCase()) {
    errors.push("departureCountry must differ from the trip's country");
  }
  return errors;
}

function slugify(country: string): string {
  return country.toLowerCase().replace(/\s+/g, "-");
}

function toBooking(row: any): Booking {
  return {
    id: row.id,
    tripId: row.trip_id,
    userId: row.user_id,
    destinationId: row.destination_id,
    destinationCountry: row.destination_country,
    departureCountry: row.departure_country,
    departureDate: row.departure_date,
    arrivalDate: row.arrival_date,
    adults: row.adults,
    children: row.children,
    travelerFirstName: row.traveler_first_name,
    travelerLastName: row.traveler_last_name,
    travelerPhone: row.traveler_phone,
    travelerEmail: row.traveler_email,
    pricePerPerson: Number(row.price_per_person),
    totalPrice: Number(row.total_price),
    currency: row.currency,
    status: row.status,
    createdAt: row.created_at,
  };
}

export async function bookingsRoutes(app: FastifyInstance): Promise<void> {
  app.post(
    "/bookings",
    { schema: { body: createBookingSchema }, attachValidation: true },
    async (request, reply) => {
      let userId: string | null;
      try {
        userId = await resolveOptionalUserId(request);
      } catch (err) {
        if (err instanceof InvalidTokenError) {
          return reply.status(401).send({ error: "Invalid or expired token" });
        }
        throw err;
      }

      if (request.validationError) {
        return reply.status(400).send({
          error: "Validation failed",
          details: formatValidationErrors(request.validationError.validation),
        });
      }

      const body = request.body as CreateBookingBody;
      const trip = await findTrip(body.tripId);
      if (!trip) {
        return reply.status(400).send({
          error: "Validation failed",
          details: ["tripId does not reference an existing trip"],
        });
      }

      const ruleErrors = businessRuleErrors(body, trip);
      if (ruleErrors.length > 0) {
        return reply.status(400).send({ error: "Validation failed", details: ruleErrors });
      }

      // Destination, dates and price are copied from the trip so the booking
      // keeps what was actually purchased even if the trip changes later.
      const totalPrice = trip.pricePerPerson * (body.adults + body.children);
      const result = await pool.query(
        `INSERT INTO bookings (
          id, trip_id, user_id, destination_id, destination_country, departure_country,
          departure_date, arrival_date, adults, children,
          traveler_first_name, traveler_last_name, traveler_phone, traveler_email,
          price_per_person, total_price, currency, status
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,'CONFIRMED')
        RETURNING *`,
        [
          randomUUID(),
          trip.id,
          userId,
          slugify(trip.country),
          trip.country,
          body.departureCountry.trim(),
          trip.departureDate,
          trip.arrivalDate,
          body.adults,
          body.children,
          body.traveler.firstName.trim(),
          body.traveler.lastName.trim(),
          body.traveler.phone.trim(),
          body.traveler.email.trim(),
          trip.pricePerPerson,
          totalPrice,
          trip.currency,
        ],
      );

      return reply.status(201).send({ booking: toBooking(result.rows[0]) });
    },
  );

  app.get(
    "/bookings/:id",
    { schema: { params: bookingParamsSchema }, attachValidation: true },
    async (request, reply) => {
      if (request.validationError) {
        return reply.status(400).send({
          error: "Validation failed",
          details: formatValidationErrors(request.validationError.validation),
        });
      }

      const { id } = request.params as { id: string };
      const result = await pool.query("SELECT * FROM bookings WHERE id = $1", [id]);
      if (result.rowCount === 0) {
        return reply.status(404).send({ error: "Booking not found" });
      }
      return reply.send({ booking: toBooking(result.rows[0]) });
    },
  );
}
