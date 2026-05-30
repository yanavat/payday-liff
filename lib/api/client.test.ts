import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Test the retry and error handling logic of ApiClient in isolation
// We exercise it via a minimal inline client instance

interface TestApiError {
  message: string;
  statusCode: number;
  details?: unknown;
}

async function buildClient(fetchImpl: typeof fetch) {
  // Dynamically import to avoid singleton contamination between tests
  const mod = await import("./client?t=" + Date.now());
  return mod;
}

describe("ApiClient fetchWithRetry behaviour", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("retries once on network failure (fetch throws)", async () => {
    let calls = 0;
    globalThis.fetch = vi.fn().mockImplementation(async () => {
      calls++;
      if (calls === 1) throw new Error("Network error");
      return new Response(JSON.stringify({ id: "1" }), { status: 200 });
    }) as unknown as typeof fetch;

    const { getApiClient } = await import("./client");
    // Reset singleton so fresh fetch is used
    (getApiClient as unknown as { __cache?: undefined }).__cache = undefined;
    const client = getApiClient();

    // Use a timeout to avoid real 1s wait in tests
    vi.useFakeTimers();
    const promise = client.get<{ id: string }>("/test");
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(calls).toBe(2);
    expect(result).toEqual({ id: "1" });
    vi.useRealTimers();
  });

  it("retries once on 5xx response", async () => {
    let calls = 0;
    globalThis.fetch = vi.fn().mockImplementation(async () => {
      calls++;
      if (calls === 1)
        return new Response("Server Error", {
          status: 500,
          statusText: "Server Error",
        });
      return new Response(JSON.stringify({ id: "2" }), { status: 200 });
    }) as unknown as typeof fetch;

    vi.useFakeTimers();
    const { getApiClient } = await import("./client");
    const client = getApiClient();
    const promise = client.get<{ id: string }>("/test");
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(calls).toBe(2);
    expect(result).toEqual({ id: "2" });
    vi.useRealTimers();
  });

  it("does NOT retry on 4xx responses", async () => {
    let calls = 0;
    globalThis.fetch = vi.fn().mockImplementation(async () => {
      calls++;
      return new Response(
        JSON.stringify({ message: "Not Found", statusCode: 404 }),
        {
          status: 404,
          statusText: "Not Found",
        },
      );
    }) as unknown as typeof fetch;

    const { getApiClient } = await import("./client");
    const client = getApiClient();

    await expect(client.get("/test")).rejects.toMatchObject({
      statusCode: 404,
    });
    expect(calls).toBe(1);
  });

  it("throws ApiError with correct statusCode on non-OK response", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
        statusText: "Unauthorized",
      }),
    ) as unknown as typeof fetch;

    const { getApiClient } = await import("./client");
    const client = getApiClient();

    await expect(client.get("/secure")).rejects.toMatchObject({
      statusCode: 401,
    });
  });

  it("routes Next API proxy paths to the current origin instead of backend baseURL", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ hrUser: { id: "hr-1" } }), {
        status: 200,
      }),
    ) as unknown as typeof fetch;
    globalThis.fetch = fetchMock;

    const { getApiClient } = await import("./client?t=" + Date.now());
    const client = getApiClient();

    await client.get("/api/auth/me");

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3000/api/auth/me",
      expect.objectContaining({ credentials: "include", method: "GET" }),
    );
  });

  it("prefixes browser data requests with /api/", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ items: [] }), { status: 200 }),
    ) as unknown as typeof fetch;
    globalThis.fetch = fetchMock;

    const { getApiClient } = await import("./client?t=" + Date.now());
    const client = getApiClient();

    await client.get("/companies");

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3000/api/companies",
      expect.objectContaining({ credentials: "include", method: "GET" }),
    );
  });

  it("handles 204 No Content by returning undefined", async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(
        new Response(null, { status: 204 }),
      ) as unknown as typeof fetch;

    const { getApiClient } = await import("./client");
    const client = getApiClient();

    const result = await client.delete("/resource/1");
    expect(result).toBeUndefined();
  });

});

describe("getApiErrorMessage — error code mapping", () => {
  it("maps HTTP status codes to user-facing keys", async () => {
    const { getApiErrorMessage } = await import("./errors");
    const t = (k: string) => k;

    const cases: Array<[TestApiError, string]> = [
      [{ statusCode: 401, message: "Unauthorized" }, "common.sessionExpired"],
      [{ statusCode: 403, message: "Forbidden" }, "common.noPermission"],
      [
        { statusCode: 500, message: "Internal Server Error" },
        "common.serverError",
      ],
      [
        { statusCode: 503, message: "Service Unavailable" },
        "common.serverError",
      ],
    ];

    for (const [error, expected] of cases) {
      expect(getApiErrorMessage(error, t)).toBe(expected);
    }
  });

  it("treats missing statusCode as a network error", async () => {
    const { getApiErrorMessage } = await import("./errors");
    const t = (k: string) => k;
    expect(getApiErrorMessage({ message: "Failed to fetch" }, t)).toBe(
      "common.networkError",
    );
  });
});
