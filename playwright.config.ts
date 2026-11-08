import { defineConfig } from "@playwright/test";

const useWebKit = process.env.PLAYWRIGHT_BROWSER === "webkit";

export default defineConfig({
  testDir: "./tests/browser",
  fullyParallel: true,
  workers: 2,
  timeout: 60_000,
  reporter: "list",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3001",
    browserName: useWebKit ? "webkit" : "chromium",
    channel: useWebKit ? undefined : "chrome",
    viewport: { width: 390, height: 844 },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
});
