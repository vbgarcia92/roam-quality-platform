import { defineConfig, devices } from "@playwright/test";
import { API_URL, WEB_URL } from "./sut";

export default defineConfig({
  globalSetup: "./global-setup.ts",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
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
});
