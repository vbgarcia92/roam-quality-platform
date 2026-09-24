import { FastifyInstance } from "fastify";
import { setTimeout as sleep } from "timers/promises";
import { DESTINATIONS } from "../data/destinations";
import { config } from "../config";

// "/trips" exposes the bookable catalogue: one entry per destination country
// with its fixed price. The booking flow itself lives under /bookings.
export async function tripsRoutes(app: FastifyInstance): Promise<void> {
  app.get("/trips", async (_request, reply) => {
    if (config.chaosLatency) {
      await sleep(config.chaosLatencyMs);
    }
    return reply.send({ trips: DESTINATIONS });
  });

  app.get("/trips/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const trip = DESTINATIONS.find((d) => d.id === id);
    if (!trip) {
      return reply.status(404).send({ error: "Trip not found" });
    }
    return reply.send({ trip });
  });
}
