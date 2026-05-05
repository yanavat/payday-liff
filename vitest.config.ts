import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    include: ["**/*.test.{ts,tsx}"],
    exclude: [
      "node_modules",
      ".next",
      ".npm-cache",
      "**/node_modules/**",
      "**/.npm-cache/**",
    ],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
});
