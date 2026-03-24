import { NextResponse } from "next/server";

import { env } from "@/lib/env";

export interface TrustedAdminIdentity {
  email: string | null;
  name: string | null;
  userId: string;
}

function copyHeaderIfPresent(
  target: Headers,
  source: Headers,
  headerName: string,
) {
  const value = source.get(headerName);

  if (value) {
    target.set(headerName, value);
  }
}

export function getLmsSlsConfig() {
  const rawBaseUrl = env.lmsSlsBaseUrl;
  const apiKey = env.lmsSlsApiKey;

  const normalizedBaseUrl = /^[a-zA-Z][a-zA-Z\d+.-]*:\/\//.test(rawBaseUrl)
    ? rawBaseUrl
    : `http://${rawBaseUrl}`;

  return {
    apiKey,
    baseUrl: normalizedBaseUrl.endsWith("/")
      ? normalizedBaseUrl
      : `${normalizedBaseUrl}/`,
  };
}

export function createTrustedAdminHeaders(admin: TrustedAdminIdentity) {
  const headers = new Headers();

  headers.set("x-admin-user-id", admin.userId);

  if (admin.email) {
    headers.set("x-admin-email", admin.email);
  }

  if (admin.name) {
    headers.set("x-admin-name", admin.name);
  }

  return headers;
}

export function getForwardedSessionHeaders(source: Headers) {
  const headers = new Headers();

  copyHeaderIfPresent(headers, source, "authorization");
  copyHeaderIfPresent(headers, source, "cookie");

  return headers;
}

export function mergeHeaders(...headerSets: Array<HeadersInit | undefined>) {
  const headers = new Headers();

  for (const headerSet of headerSets) {
    if (!headerSet) {
      continue;
    }

    for (const [key, value] of new Headers(headerSet).entries()) {
      headers.set(key, value);
    }
  }

  return headers;
}

interface ForwardLmsSlsRequestOptions {
  body?: string;
  contentType?: string | null;
  headers?: HeadersInit;
  method: string;
  path: string;
  search?: string;
}

export async function forwardLmsSlsRequest({
  body,
  contentType,
  headers: additionalHeaders,
  method,
  path,
  search = "",
}: ForwardLmsSlsRequestOptions) {
  const { apiKey, baseUrl } = getLmsSlsConfig();
  const targetUrl = new URL(path.replace(/^\//, ""), baseUrl);
  targetUrl.search = search;

  const headers = new Headers(additionalHeaders);

  if (contentType && !headers.has("content-type")) {
    headers.set("content-type", contentType);
  }

  headers.set("x-internal-api-key", apiKey);

  const response = await fetch(targetUrl, {
    method,
    headers,
    body: body && body.length > 0 ? body : undefined,
    cache: "no-store",
  });

  const responseBody = await response.text();
  const responseHeaders = new Headers();
  const responseContentType = response.headers.get("content-type");

  if (responseContentType) {
    responseHeaders.set("content-type", responseContentType);
  }

  return new Response(responseBody, {
    status: response.status,
    headers: responseHeaders,
  });
}

export async function proxyLmsSlsRequest({
  admin,
  path,
  request,
}: {
  admin: TrustedAdminIdentity;
  path: string;
  request: Request;
}) {
  try {
    const incomingUrl = new URL(request.url);
    const method = request.method.toUpperCase();
    const contentType = request.headers.get("content-type");
    const body =
      method === "GET" || method === "HEAD" ? undefined : await request.text();

    return await forwardLmsSlsRequest({
      body,
      contentType,
      headers: mergeHeaders(
        createTrustedAdminHeaders(admin),
        getForwardedSessionHeaders(request.headers),
      ),
      method,
      path,
      search: incomingUrl.search,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";

    return NextResponse.json(
      { error: `Failed to reach lms-sls service: ${message}` },
      { status: 500 },
    );
  }
}
