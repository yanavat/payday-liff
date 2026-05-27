import { NextResponse } from "next/server";

type AuthRouteContext = {
  params: Promise<{ path: string[] }>;
};

const DEFAULT_API_BASE_URL = "http://localhost:4000";
const EMPLOYEE_AUTH_PATHS = new Set([
  "activate",
  "login",
  "line-login",
  "link-line",
  "verify-pin",
]);

function getBackendBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ??
    DEFAULT_API_BASE_URL
  );
}

async function buildBackendUrl(request: Request, context: AuthRouteContext) {
  const { path } = await context.params;
  const backendPath =
    path.length === 1 && EMPLOYEE_AUTH_PATHS.has(path[0])
      ? ["employee", path[0]]
      : path;
  const target = new URL(`/auth/${backendPath.map(encodeURIComponent).join("/")}`, getBackendBaseUrl());
  const source = new URL(request.url);
  target.search = source.search;
  return target.toString();
}

function buildForwardHeaders(request: Request, hasJsonBody: boolean) {
  const headers = new Headers();
  const contentType = request.headers.get("content-type");
  const companyId = request.headers.get("x-company-id");
  const cookie = request.headers.get("cookie");

  if (contentType) {
    headers.set("Content-Type", contentType);
  } else if (hasJsonBody) {
    headers.set("Content-Type", "application/json");
  }

  if (companyId) {
    headers.set("x-company-id", companyId);
  }

  if (cookie) {
    headers.set("cookie", cookie);
  }

  return headers;
}

function getSetCookieHeaders(headers: Headers) {
  const withGetSetCookie = headers as Headers & {
    getSetCookie?: () => string[];
  };
  const setCookieHeaders = withGetSetCookie.getSetCookie?.();

  if (setCookieHeaders?.length) {
    return setCookieHeaders;
  }

  const setCookie = headers.get("set-cookie");
  return setCookie ? [setCookie] : [];
}

async function proxyAuthRequest(request: Request, context: AuthRouteContext) {
  try {
    const hasBody = request.method !== "GET" && request.method !== "HEAD";
    const body = hasBody ? await request.text() : undefined;
    const backendUrl = await buildBackendUrl(request, context);
    const backendResponse = await fetch(backendUrl, {
      method: request.method,
      headers: buildForwardHeaders(request, hasBody),
      body: body && body.length > 0 ? body : undefined,
    });

    const responseHeaders = new Headers();
    const contentType = backendResponse.headers.get("content-type");
    if (contentType) {
      responseHeaders.set("Content-Type", contentType);
    }

    const responseBody = await backendResponse.arrayBuffer();
    const response = new NextResponse(responseBody, {
      status: backendResponse.status,
      statusText: backendResponse.statusText,
      headers: responseHeaders,
    });

    for (const cookie of getSetCookieHeaders(backendResponse.headers)) {
      response.headers.append("Set-Cookie", cookie);
    }

    return response;
  } catch {
    return NextResponse.json({ message: "Proxy error" }, { status: 500 });
  }
}

export async function GET(request: Request, context: AuthRouteContext) {
  return proxyAuthRequest(request, context);
}

export async function POST(request: Request, context: AuthRouteContext) {
  return proxyAuthRequest(request, context);
}
