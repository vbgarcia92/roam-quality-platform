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
