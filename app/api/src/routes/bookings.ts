import { FastifyInstance } from "fastify";
import { randomUUID } from "crypto";
import { pool } from "../db";
import { findDestination } from "../data/destinations";
import { Booking, CreateBookingBody } from "../types";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(body: Partial<CreateBookingBody>): string[] {
  const errors: string[] = [];

  if (!body.destinationId || !findDestination(body.destinationId)) {
    errors.push("destinationId must reference a valid destination");
  }
  if (!body.departureCountry || !body.departureCountry.trim()) {
    errors.push("departureCountry is required");
  }
  if (!body.departureDate) errors.push("departureDate is required");
  if (!body.arrivalDate) errors.push("arrivalDate is required");
  if (
    body.departureDate &&
    body.arrivalDate &&
    new Date(body.arrivalDate) < new Date(body.departureDate)
  ) {
    errors.push("arrivalDate must be on or after departureDate");
  }
  if (!Number.isInteger(body.adults) || (body.adults as number) < 1) {
    errors.push("adults must be an integer >= 1");
  }
  if (!Number.isInteger(body.children) || (body.children as number) < 0) {
    errors.push("children must be an integer >= 0");
  }
  const traveler = body.traveler;
  if (!traveler) {
    errors.push("traveler information is required");
  } else {
    if (!traveler.firstName?.trim()) errors.push("traveler.firstName is required");
    if (!traveler.lastName?.trim()) errors.push("traveler.lastName is required");
    if (!traveler.phone?.trim()) errors.push("traveler.phone is required");
    if (!traveler.email?.trim() || !EMAIL_RE.test(traveler.email)) {
      errors.push("traveler.email must be a valid email address");
    }
  }

  return errors;
}

function toBooking(row: any): Booking {
  return {
    id: row.id,
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
  app.post("/bookings", async (request, reply) => {
    const body = request.body as Partial<CreateBookingBody>;
    const errors = validate(body);
    if (errors.length > 0) {
      return reply.status(400).send({ error: "Validation failed", details: errors });
    }

    const destination = findDestination(body.destinationId as string)!;
    const travelerCount = (body.adults as number) + (body.children as number);
    const totalPrice = destination.pricePerPerson * travelerCount;
    const id = randomUUID();

    const result = await pool.query(
      `INSERT INTO bookings (
        id, destination_id, destination_country, departure_country,
        departure_date, arrival_date, adults, children,
        traveler_first_name, traveler_last_name, traveler_phone, traveler_email,
        price_per_person, total_price, currency, status
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,'CONFIRMED')
      RETURNING *`,
      [
        id,
        destination.id,
        destination.country,
        body.departureCountry,
        body.departureDate,
        body.arrivalDate,
        body.adults,
        body.children,
        body.traveler!.firstName.trim(),
        body.traveler!.lastName.trim(),
        body.traveler!.phone.trim(),
        body.traveler!.email.trim(),
        destination.pricePerPerson,
        totalPrice,
        destination.currency,
      ],
    );

    return reply.status(201).send({ booking: toBooking(result.rows[0]) });
  });

  app.get("/bookings/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const result = await pool.query("SELECT * FROM bookings WHERE id = $1", [id]);
    if (result.rowCount === 0) {
      return reply.status(404).send({ error: "Booking not found" });
    }
    return reply.send({ booking: toBooking(result.rows[0]) });
  });
}
