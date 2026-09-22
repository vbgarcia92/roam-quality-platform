import { Pool, types } from "pg";
import { config } from "./config";

// Keep DATE columns as plain "YYYY-MM-DD" strings instead of pg's default
// JS Date conversion, which would serialize with a spurious time/timezone.
types.setTypeParser(types.builtins.DATE, (value: string) => value);

export const pool = new Pool({ connectionString: config.databaseUrl });

export async function waitForDatabase(retries = 20, delayMs = 1000): Promise<void> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await pool.query("SELECT 1");
      return;
    } catch (err) {
      if (attempt === retries) throw err;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}

export async function ensureSchema(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS bookings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      destination_id TEXT NOT NULL,
      destination_country TEXT NOT NULL,
      departure_country TEXT NOT NULL,
      departure_date DATE NOT NULL,
      arrival_date DATE NOT NULL,
      adults INTEGER NOT NULL,
      children INTEGER NOT NULL,
      traveler_first_name TEXT NOT NULL,
      traveler_last_name TEXT NOT NULL,
      traveler_phone TEXT NOT NULL,
      traveler_email TEXT NOT NULL,
      price_per_person NUMERIC(10, 2) NOT NULL,
      total_price NUMERIC(10, 2) NOT NULL,
      currency TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'CONFIRMED',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
}
