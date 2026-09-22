import { buildApp } from "./app";
import { config } from "./config";
import { waitForDatabase, ensureSchema } from "./db";

async function main(): Promise<void> {
  const app = buildApp();

  await waitForDatabase();
  await ensureSchema();

  await app.listen({ port: config.port, host: config.host });
}

main().catch((err) => {
  console.error("Failed to start server", err);
  process.exit(1);
});
