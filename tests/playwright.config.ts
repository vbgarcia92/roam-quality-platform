import { defineConfig, devices } from "@playwright/test";
import { API_URL, WEB_URL } from "./sut";

export default defineConfig({
  globalSetup: "./global-setup.ts",
  fullyParallel: true,
  timeout: 30 * 1000, // 30 seconds - valid for the entire test
  expect: {
    timeout: 10000, // 10 seconds - valid for each assertion / expect() call
  },
  forbidOnly: !!process.env.CI, // Fail the build on CI if you accidentally left test only in the source code
  retries: process.env.CI ? 2 : 0, // Automatically retry tests on CI if they fail to absorb network/infrastructure noise
  workers: process.env.CI ? 2 : undefined, // Use 2 worker on CI to avoid overloading shared infrastructure
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    trace: "retain-on-failure", // Retain trace when test fails to help investigate the root cause
    screenshot: "only-on-failure", // Capture screenshot when test fails to help investigate the root cause
  },
  projects: [
    {
      name: "api",
      testDir: "./api",
      use: { baseURL: API_URL },
    },
    {
      name: "ui",
      testDir: "./ui",
      use: { ...devices["Desktop Chrome"], baseURL: WEB_URL },
    },
  ],
  webServer: {
    // Compose owns Postgres + API + web (nginx on :8080). Foreground (no -d)
    // so Playwright can tear the stack down when the run ends.
    command: "docker compose up",
    // Commands run from this config's folder (tests/); compose lives in app/.
    cwd: "../app",
    // Goes through nginx to the API's /health, so it only passes when both
    // the web and API containers are up (not "the DB is seeded").
    url: "http://localhost:8080/api/health",
    // Cold start builds images and runs migrations; 60s default isn't enough.
    timeout: 120_000,
    // Locally: if it's already up, use it. In CI: always start clean,
    // and fail loudly if something is already on that port.
    reuseExistingServer: !process.env.CI,
  },
});
