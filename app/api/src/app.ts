import path from "path";
import Fastify, { FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import fastifyStatic from "@fastify/static";
import { healthRoutes } from "./routes/health";
import { tripsRoutes } from "./routes/trips";
import { bookingsRoutes } from "./routes/bookings";

export function buildApp(): FastifyInstance {
  const app = Fastify({ logger: true });

  app.register(cors, { origin: true });

  app.register(fastifyStatic, {
    root: path.join(__dirname, "..", "public"),
    prefix: "/",
  });

  app.register(healthRoutes);
  app.register(tripsRoutes);
  app.register(bookingsRoutes);

  return app;
}
