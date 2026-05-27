import { afterEach, describe, expect, it, vi } from "vitest";

import { GET, POST } from "./route";

const context = (path: string[]) => ({ params: Promise.resolve({ path }) });

describe("/api/auth proxy route", () => {
  const originalApiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  afterEach(() => {
    vi.restoreAllMocks();
    if (originalApiBaseUrl === undefined) {
      delete process.env.NEXT_PUBLIC_API_BASE_URL;
    } else {
      process.env.NEXT_PUBLIC_API_BASE_URL = originalApiBaseUrl;
    }
  });

  it("forwards POST auth requests and backend set-cookie headers", async () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "http://backend.test";
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Set-Cookie": "payday_token=jwt; HttpOnly; Path=/",
        },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const request = new Request("http://localhost/api/auth/hr/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-company-id": "company-1",
        cookie: "payday_token=old",
      },
      body: JSON.stringify({ email: "hr@example.com", password: "demo1234" }),
    });

    const response = await POST(request, context(["hr", "login"]));

    expect(fetchMock).toHaveBeenCalledWith(
      "http://backend.test/auth/hr/login",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ email: "hr@example.com", password: "demo1234" }),
      }),
    );
    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers.get("x-company-id")).toBe("company-1");
    expect(init.headers.get("cookie")).toBe("payday_token=old");
    expect(init.headers.get("Content-Type")).toBe("application/json");
    await expect(response.json()).resolves.toEqual({ success: true });
    expect(response.status).toBe(200);
    expect(response.headers.get("Set-Cookie")).toContain("payday_token=jwt");
  });

  it.each([
    [["activate"], "http://backend.test/auth/employee/activate"],
    [["login"], "http://backend.test/auth/employee/login"],
    [["line-login"], "http://backend.test/auth/employee/line-login"],
    [["link-line"], "http://backend.test/auth/employee/link-line"],
    [["verify-pin"], "http://backend.test/auth/employee/verify-pin"],
    [["hr", "login"], "http://backend.test/auth/hr/login"],
    [["logout"], "http://backend.test/auth/logout"],
  ])("maps /api/auth/%s to backend %s", async (path, expectedUrl) => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "http://backend.test";
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json({ success: true }, { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await POST(
      new Request(`http://localhost/api/auth/${path.join("/")}`, {
        method: "POST",
        body: JSON.stringify({ ok: true }),
      }),
      context(path),
    );

    expect(fetchMock).toHaveBeenCalledWith(
      expectedUrl,
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("forwards GET auth requests with query strings and cookies", async () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "http://backend.test";
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json({ employee: { id: "emp-1" } }, { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const request = new Request("http://localhost/api/auth/me?fresh=1", {
      headers: {
        cookie: "payday_token=jwt",
      },
    });

    const response = await GET(request, context(["me"]));

    expect(fetchMock).toHaveBeenCalledWith(
      "http://backend.test/auth/me?fresh=1",
      expect.objectContaining({ method: "GET" }),
    );
    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers.get("cookie")).toBe("payday_token=jwt");
    await expect(response.json()).resolves.toEqual({ employee: { id: "emp-1" } });
  });

  it("returns a proxy error response when forwarding fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

    const response = await POST(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ identifier: "user@example.com", pin: "123456" }),
      }),
      context(["login"]),
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ message: "Proxy error" });
  });
});
