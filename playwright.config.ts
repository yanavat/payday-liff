import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  expect: {
    timeout: 10_000,
  },
  use: {
    baseURL: "http://127.0.0.1:3100",
    trace: "on-first-retry",
  },
  webServer: [
    {
      command: "node e2e/mock-auth-backend.mjs",
      url: "http://127.0.0.1:4010/health",
      reuseExistingServer: false,
    },
    {
      command:
        "NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:4010 NEXT_PUBLIC_LIFF_ID=test-liff-id NEXT_PUBLIC_LIFF_MOCK=false npm run dev -- -p 3100",
      url: "http://127.0.0.1:3100/en",
      reuseExistingServer: false,
    },
  ],
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
