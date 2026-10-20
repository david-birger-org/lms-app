import { NextResponse } from "next/server";

import { requireAdminApiAccess } from "@/lib/auth/admin-server";
import { requireAuthApiAccess } from "@/lib/auth/auth-server";
import {
  createTrustedAdminHeaders,
  forwardLmsSlsRequest,
  getForwardedSessionHeaders,
  mergeHeaders,
} from "@/lib/server/lms-sls";
import { createTrustedUserHeaders } from "@/lib/server/lms-sls-user";

type ProxyAuth = "admin" | "user";
type ProxySearch = "incoming" | "none" | (() => string);

interface ProxyRouteOptions {
  auth: ProxyAuth;
  method: string;
  path: string;
  errorMessage: string;
  forwardBody?: boolean;
  // Forward the request body as raw bytes with this content type instead of
  // JSON text (e.g. "application/pdf" uploads).
  rawBodyContentType?: string;
  search?: ProxySearch;
}

type ResolvedHeaders =
  | { ok: true; headers: Headers }
  | { ok: false; response: NextResponse };

export async function resolveProxyHeaders(
  auth: ProxyAuth,
  request: Request,
): Promise<ResolvedHeaders> {
  if (auth === "admin") {
    const access = await requireAdminApiAccess(request);
    if (!access.ok) return { ok: false, response: access.response };
    return {
      ok: true,
      headers: mergeHeaders(
        createTrustedAdminHeaders(access.admin),
        getForwardedSessionHeaders(request.headers),
      ),
    };
  }

  const access = await requireAuthApiAccess(request);
  if (!access.ok) return { ok: false, response: access.response };
  return {
    ok: true,
    headers: mergeHeaders(
      createTrustedUserHeaders(access.authenticatedUser),
      getForwardedSessionHeaders(request.headers),
    ),
  };
}

function resolveSearch(search: ProxySearch | undefined, request: Request) {
  if (typeof search === "function") return search();
  if (search === "incoming") return new URL(request.url).search;
  return undefined;
}

// Builds a Next route handler that authenticates (admin or user), mints the
// trusted identity headers, and forwards to lms-sls. Replaces the per-route
// auth -> mergeHeaders -> forwardLmsSlsRequest -> try/catch boilerplate.
export function createProxyRoute(options: ProxyRouteOptions) {
  return async function proxyRoute(request: Request): Promise<Response> {
    try {
      const resolved = await resolveProxyHeaders(options.auth, request);
      if (!resolved.ok) return resolved.response;

      const { rawBodyContentType } = options;
      return await forwardLmsSlsRequest({
        body: rawBodyContentType
          ? await request.arrayBuffer()
          : options.forwardBody
            ? await request.text()
            : undefined,
        contentType:
          rawBodyContentType ??
          (options.forwardBody ? "application/json" : undefined),
        headers: resolved.headers,
        method: options.method,
        path: options.path,
        search: resolveSearch(options.search, request),
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unexpected error";
      return NextResponse.json(
        { error: `${options.errorMessage}: ${message}` },
        { status: 500 },
      );
    }
  };
}
