import { FastifyInstance } from "fastify";
import { setTimeout as sleep } from "timers/promises";
import { pool } from "../db";
import { config } from "../config";
import { earliestCurrentDate } from "../dates";
import { formatValidationErrors } from "../validation";
import { Trip } from "../types";

const TRIP_COLUMNS = "id, country, departure_date, arrival_date, price_per_person, currency";

const tripParamsSchema = {
  type: "object",
  required: ["id"],
  properties: { id: { type: "string", format: "uuid" } },
} as const;

function toTrip(row: any): Trip {
  return {
    id: row.id,
    country: row.country,
    departureDate: row.departure_date,
    arrivalDate: row.arrival_date,
    pricePerPerson: Number(row.price_per_person),
    currency: row.currency,
  };
}

export async function findTrip(id: string): Promise<Trip | null> {
  const result = await pool.query(`SELECT ${TRIP_COLUMNS} FROM trips WHERE id = $1`, [id]);
  return result.rowCount === 0 ? null : toTrip(result.rows[0]);
}

export async function tripsRoutes(app: FastifyInstance): Promise<void> {
  // Trip search: upcoming trips only, soonest first.
  app.get("/trips", async (_request, reply) => {
    if (config.chaosLatency) {
      await sleep(config.chaosLatencyMs);
    }
    const result = await pool.query(
      `SELECT ${TRIP_COLUMNS} FROM trips
       WHERE departure_date >= $1
       ORDER BY departure_date, country`,
      [earliestCurrentDate()],
    );
    return reply.send({ trips: result.rows.map(toTrip) });
  });

  app.get(
    "/trips/:id",
    { schema: { params: tripParamsSchema }, attachValidation: true },
    async (request, reply) => {
      if (request.validationError) {
        return reply.status(400).send({
          error: "Validation failed",
          details: formatValidationErrors(request.validationError.validation),
        });
      }

      const { id } = request.params as { id: string };
      const trip = await findTrip(id);
      if (!trip) {
        return reply.status(404).send({ error: "Trip not found" });
      }
      return reply.send({ trip });
    },
  );
}
