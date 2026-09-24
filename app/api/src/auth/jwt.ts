import { FastifyRequest } from "fastify";
import { pool } from "../db";

export interface TokenPayload {
  sub: string;
  email: string;
}

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: TokenPayload;
    user: TokenPayload & { iat: number; exp: number };
  }
}

export class InvalidTokenError extends Error {}

// Bookings accept guests, so auth is optional: no Authorization header means
// a guest booking (null), but a header that's present must be a valid token
// for a user that still exists.
export async function resolveOptionalUserId(request: FastifyRequest): Promise<string | null> {
  if (!request.headers.authorization) return null;

  try {
    await request.jwtVerify();
  } catch {
    throw new InvalidTokenError();
  }

  const result = await pool.query("SELECT id FROM users WHERE id = $1", [request.user.sub]);
  if (result.rowCount === 0) throw new InvalidTokenError();
  return request.user.sub;
}
