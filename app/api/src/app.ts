import path from "path";
import Fastify, { FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import fastifyJwt from "@fastify/jwt";
import fastifyStatic from "@fastify/static";
import { config } from "./config";
import { healthRoutes } from "./routes/health";
import { tripsRoutes } from "./routes/trips";
import { bookingsRoutes } from "./routes/bookings";
import { authRoutes } from "./routes/auth";

export function buildApp(): FastifyInstance {
  const app = Fastify({
    logger: true,
    ajv: {
      customOptions: {
        // Fastify coerces by default, which would accept e.g. `"adults": true`
        // as 1. Booking payloads should be rejected when types are wrong.
        coerceTypes: false,
        allErrors: true,
      },
    },
  });

  app.register(cors, { origin: true });
  app.register(fastifyJwt, {
    secret: config.jwtSecret,
    sign: { expiresIn: `${config.tokenTtlSeconds}s` },
  });

  app.register(fastifyStatic, {
    root: path.join(__dirname, "..", "public"),
    prefix: "/",
  });

  app.register(healthRoutes);
  app.register(tripsRoutes);
  app.register(bookingsRoutes);
  app.register(authRoutes);

  return app;
}
