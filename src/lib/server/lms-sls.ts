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

  const responseHeaders = new Headers();
  for (const name of [
    "content-type",
    "content-disposition",
    "content-length",
  ]) {
    const value = response.headers.get(name);
    if (value) responseHeaders.set(name, value);
  }

  return new Response(response.body, {
    status: response.status,
    headers: responseHeaders,
  });
}
