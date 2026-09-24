import { FastifyInstance } from "fastify";
import { randomUUID } from "crypto";
import { pool } from "../db";
import { DESTINATIONS, findDestination } from "../data/destinations";
import { Booking, CreateBookingBody } from "../types";
import { formatValidationErrors } from "../validation";
import { InvalidTokenError, resolveOptionalUserId } from "../auth/jwt";

const MAX_TRAVELERS_PER_TYPE = 10;
const NON_BLANK = "\\S";

const nameSchema = { type: "string", minLength: 1, maxLength: 100, pattern: NON_BLANK } as const;

const createBookingSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "destinationId",
    "departureCountry",
    "departureDate",
    "arrivalDate",
    "adults",
    "children",
    "traveler",
  ],
  properties: {
    destinationId: { type: "string", enum: DESTINATIONS.map((d) => d.id) },
    departureCountry: nameSchema,
    departureDate: { type: "string", format: "date" },
    arrivalDate: { type: "string", format: "date" },
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

// The earliest calendar date currently in effect anywhere (UTC-12), so a
// traveler west of UTC booking "today" late in their evening isn't rejected.
function earliestCurrentDate(): string {
  return new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

// Cross-field rules JSON Schema can't express. Dates are YYYY-MM-DD, so
// string comparison is chronological.
function businessRuleErrors(body: CreateBookingBody): string[] {
  const errors: string[] = [];
  if (body.departureDate < earliestCurrentDate()) {
    errors.push("departureDate must not be in the past");
  }
  if (body.arrivalDate < body.departureDate) {
    errors.push("arrivalDate must be on or after departureDate");
  }
  return errors;
}

function toBooking(row: any): Booking {
  return {
    id: row.id,
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
      const ruleErrors = businessRuleErrors(body);
      if (ruleErrors.length > 0) {
        return reply.status(400).send({ error: "Validation failed", details: ruleErrors });
      }

      const destination = findDestination(body.destinationId)!;
      const totalPrice = destination.pricePerPerson * (body.adults + body.children);

      const result = await pool.query(
        `INSERT INTO bookings (
          id, user_id, destination_id, destination_country, departure_country,
          departure_date, arrival_date, adults, children,
          traveler_first_name, traveler_last_name, traveler_phone, traveler_email,
          price_per_person, total_price, currency, status
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,'CONFIRMED')
        RETURNING *`,
        [
          randomUUID(),
          userId,
          destination.id,
          destination.country,
          body.departureCountry.trim(),
          body.departureDate,
          body.arrivalDate,
          body.adults,
          body.children,
          body.traveler.firstName.trim(),
          body.traveler.lastName.trim(),
          body.traveler.phone.trim(),
          body.traveler.email.trim(),
          destination.pricePerPerson,
          totalPrice,
          destination.currency,
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
