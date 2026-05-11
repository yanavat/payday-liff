import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  pushMessage,
  multicastMessage,
  isLineMessagingConfigured,
} from "./messaging-api";

describe("messaging-api", () => {
  const fetchSpy = vi.fn();

  beforeEach(() => {
    fetchSpy.mockClear();
    global.fetch = fetchSpy;
    vi.stubEnv("LINE_CHANNEL_ACCESS_TOKEN", "test-token");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("pushMessage sends a POST to the LINE push endpoint", async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => "{}",
    });

    const result = await pushMessage({
      to: "U123",
      messages: [{ type: "text", text: "hello" }],
    });

    expect(result).toBe(true);
    expect(fetchSpy).toHaveBeenCalledWith(
      "https://api.line.me/v2/bot/message/push",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer test-token",
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({
          to: "U123",
          messages: [{ type: "text", text: "hello" }],
        }),
      }),
    );
  });

  it("pushMessage returns false on API error", async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: false,
      status: 400,
      text: async () => "Bad Request",
    });

    const result = await pushMessage({ to: "U123", messages: [] });
    expect(result).toBe(false);
  });

  it("pushMessage returns true in mock mode", async () => {
    vi.stubEnv("LINE_CHANNEL_ACCESS_TOKEN", "mock-token");
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    const result = await pushMessage({ to: "U123", messages: [] });

    expect(result).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("[LINE Messaging API Mock]"),
      expect.any(String),
    );
    consoleSpy.mockRestore();
  });

  it("multicastMessage sends to multiple users", async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => "{}",
    });

    const result = await multicastMessage({
      to: ["U123", "U456"],
      messages: [{ type: "text", text: "hello" }],
    });

    expect(result).toBe(true);
  });

  it("isLineMessagingConfigured returns true when token is real", () => {
    vi.stubEnv("LINE_CHANNEL_ACCESS_TOKEN", "real-token");
    expect(isLineMessagingConfigured()).toBe(true);
  });

  it("isLineMessagingConfigured returns false when token is mock", () => {
    vi.stubEnv("LINE_CHANNEL_ACCESS_TOKEN", "mock-token");
    expect(isLineMessagingConfigured()).toBe(false);
  });
});
