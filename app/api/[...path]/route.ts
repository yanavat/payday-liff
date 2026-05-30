import { NextResponse } from "next/server";

type ProxyRouteContext = {
  params: Promise<{ path: string[] }>;
};

const DEFAULT_API_BASE_URL = "http://localhost:4000";

function getBackendBaseUrl() {
  return (
    process.env.BACKEND_INTERNAL_URL?.replace(/\/$/, "") ??
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ??
    DEFAULT_API_BASE_URL
  );
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

async function proxyRequest(request: Request, context: ProxyRouteContext) {
  try {
    const { path } = await context.params;
    const backendPath = `/${path.map(encodeURIComponent).join("/")}`;
    const source = new URL(request.url);
    const target = new URL(backendPath, getBackendBaseUrl());
    target.search = source.search;

    const hasBody = request.method !== "GET" && request.method !== "HEAD";
    const body = hasBody ? await request.text() : undefined;
    const backendResponse = await fetch(target.toString(), {
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

export async function GET(request: Request, context: ProxyRouteContext) {
  return proxyRequest(request, context);
}

export async function POST(request: Request, context: ProxyRouteContext) {
  return proxyRequest(request, context);
}

export async function PATCH(request: Request, context: ProxyRouteContext) {
  return proxyRequest(request, context);
}

export async function PUT(request: Request, context: ProxyRouteContext) {
  return proxyRequest(request, context);
}

export async function DELETE(request: Request, context: ProxyRouteContext) {
  return proxyRequest(request, context);
}

