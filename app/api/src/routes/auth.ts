import { FastifyInstance } from "fastify";
import { pool } from "../db";
import { config } from "../config";
import { verifyPassword } from "../auth/password";
import { formatValidationErrors } from "../validation";

const tokenBodySchema = {
  type: "object",
  additionalProperties: false,
  required: ["email", "password"],
  properties: {
    email: { type: "string", format: "email", maxLength: 254 },
    password: { type: "string", minLength: 1, maxLength: 200 },
  },
} as const;

export async function authRoutes(app: FastifyInstance): Promise<void> {
  app.post(
    "/auth/token",
    { schema: { body: tokenBodySchema }, attachValidation: true },
    async (request, reply) => {
      if (request.validationError) {
        return reply.status(400).send({
          error: "Validation failed",
          details: formatValidationErrors(request.validationError.validation),
        });
      }

      const { email, password } = request.body as { email: string; password: string };
      const result = await pool.query(
        "SELECT id, email, password_hash FROM users WHERE lower(email) = lower($1)",
        [email],
      );
      const user = result.rows[0];
      const valid = user?.password_hash ? await verifyPassword(password, user.password_hash) : false;

      // Same response for unknown email and wrong password, so the endpoint
      // doesn't reveal which accounts exist.
      if (!valid) {
        return reply.status(401).send({ error: "Invalid email or password" });
      }

      const accessToken = app.jwt.sign({ sub: user.id, email: user.email });
      return reply.send({
        accessToken,
        tokenType: "Bearer",
        expiresIn: config.tokenTtlSeconds,
      });
    },
  );
}
