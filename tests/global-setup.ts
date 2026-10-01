import { API_URL, WEB_URL } from "./sut";

async function isUp(url: string): Promise<boolean> {
  try {
    return (await fetch(url)).ok;
  } catch {
    return false;
  }
}

// Fail fast with one actionable message instead of a connection error in
// every test when the SUT isn't running.
export default async function globalSetup(): Promise<void> {
  const checks = [`${API_URL}/health`, WEB_URL];
  const results = await Promise.all(checks.map(isUp));
  const down = checks.filter((_, i) => !results[i]);

  if (down.length > 0) {
    throw new Error(
      `SUT is not reachable: ${down.join(", ")}\n` +
        "Start it with:  cd app && docker compose up -d\n" +
        "Then seed it:   cd app/api && npm run db:seed",
    );
  }
}
