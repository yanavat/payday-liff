import { describe, it, expect } from "vitest";
import { getApiErrorMessage } from "./errors";

// Simple translate stub: returns the key as-is
const t = (key: string) => key;

describe("getApiErrorMessage", () => {
  it("returns empty string for null/undefined error", () => {
    expect(getApiErrorMessage(null, t)).toBe("");
    expect(getApiErrorMessage(undefined, t)).toBe("");
  });

  it("maps 401 to sessionExpired key", () => {
    expect(getApiErrorMessage({ statusCode: 401, message: "Unauthorized" }, t)).toBe(
      "common.sessionExpired",
    );
  });

  it("maps 403 to noPermission key", () => {
    expect(getApiErrorMessage({ statusCode: 403, message: "Forbidden" }, t)).toBe(
      "common.noPermission",
    );
  });

  it("maps 422 with detail message to that message", () => {
    expect(
      getApiErrorMessage(
        { statusCode: 422, message: "Unprocessable", details: { message: "Amount too high" } },
        t,
      ),
    ).toBe("Amount too high");
  });

  it("maps 422 without detail message to common.error", () => {
    expect(getApiErrorMessage({ statusCode: 422, message: "Unprocessable" }, t)).toBe(
      "common.error",
    );
  });

  it("maps 500 to serverError key", () => {
    expect(getApiErrorMessage({ statusCode: 500, message: "Internal Server Error" }, t)).toBe(
      "common.serverError",
    );
  });

  it("maps 503 to serverError key", () => {
    expect(getApiErrorMessage({ statusCode: 503, message: "Service Unavailable" }, t)).toBe(
      "common.serverError",
    );
  });

  it("maps missing statusCode to networkError key", () => {
    expect(getApiErrorMessage({ message: "Failed to fetch" }, t)).toBe("common.networkError");
    expect(getApiErrorMessage({ statusCode: 0, message: "Network error" }, t)).toBe(
      "common.networkError",
    );
  });

  it("returns the error message for other 4xx codes", () => {
    expect(getApiErrorMessage({ statusCode: 404, message: "Not Found" }, t)).toBe("Not Found");
  });

  it("falls back to common.error when message is undefined on other codes", () => {
    expect(getApiErrorMessage({ statusCode: 409, message: undefined as unknown as string }, t)).toBe(
      "common.error",
    );
  });
});
