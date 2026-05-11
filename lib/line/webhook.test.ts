import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  validateWebhookSignature,
  getChannelSecret,
  isWebhookValidationConfigured,
} from "./webhook";

describe("webhook", () => {
  beforeEach(() => {
    vi.stubEnv("LINE_CHANNEL_SECRET", "test-secret");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("validates a correct signature", () => {
    const body = '{"events":[]}';
    // Generated with HMAC-SHA256 of body using 'test-secret'
    const signature = "Va12JSFB+Fs03rxzdvh7icVLk546dmNGSrPkkClJW/U=";

    const result = validateWebhookSignature("test-secret", body, signature);
    expect(result).toBe(true);
  });

  it("rejects an incorrect signature", () => {
    const body = '{"events":[]}';
    const result = validateWebhookSignature(
      "test-secret",
      body,
      "bad-signature",
    );
    expect(result).toBe(false);
  });

  it("rejects when secret is missing", () => {
    expect(validateWebhookSignature("", "body", "sig")).toBe(false);
  });

  it("rejects when signature is missing", () => {
    expect(validateWebhookSignature("secret", "body", "")).toBe(false);
  });

  it("getChannelSecret returns env value", () => {
    expect(getChannelSecret()).toBe("test-secret");
  });

  it("isWebhookValidationConfigured returns true for real secret", () => {
    vi.stubEnv("LINE_CHANNEL_SECRET", "real-secret");
    expect(isWebhookValidationConfigured()).toBe(true);
  });

  it("isWebhookValidationConfigured returns false for mock secret", () => {
    vi.stubEnv("LINE_CHANNEL_SECRET", "mock-secret");
    expect(isWebhookValidationConfigured()).toBe(false);
  });
});
