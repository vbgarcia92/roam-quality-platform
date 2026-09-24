import { buildApp } from "./app";
import { config } from "./config";
import { waitForDatabase } from "./db";

async function main(): Promise<void> {
  const app = buildApp();

  // Schema is owned by Prisma migrations (see prisma/migrations), applied
  // via `prisma migrate deploy` before this process starts.
  await waitForDatabase();

  await app.listen({ port: config.port, host: config.host });
}

main().catch((err) => {
  console.error("Failed to start server", err);
  process.exit(1);
});
