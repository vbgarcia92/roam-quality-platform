import { FastifyInstance } from "fastify";
import { pool } from "../db";

export async function healthRoutes(app: FastifyInstance): Promise<void> {
  app.get("/health", async (_request, reply) => {
    try {
      await pool.query("SELECT 1");
      return reply.send({ status: "ok", database: "up" });
    } catch (err) {
      return reply.status(503).send({ status: "degraded", database: "down" });
    }
  });
}
