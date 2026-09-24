export const config = {
  port: Number(process.env.PORT ?? 3000),
  host: process.env.HOST ?? "0.0.0.0",
  databaseUrl:
    process.env.DATABASE_URL ??
    "postgres://roam:roam@localhost:5432/roam_trip_booking",
  jwtSecret: process.env.JWT_SECRET ?? "dev-only-insecure-jwt-secret",
  tokenTtlSeconds: 3600,
  // Deliberate defect injection for the testing phase: when enabled,
  // GET /trips is delayed by chaosLatencyMs.
  chaosLatency: process.env.CHAOS_LATENCY === "true",
  chaosLatencyMs: 4000,
};
