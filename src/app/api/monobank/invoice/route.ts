import { NextResponse } from "next/server";

import { requireAdminApiAccess } from "@/lib/auth/admin-server";
import {
  createTrustedAdminHeaders,
  forwardLmsSlsRequest,
  getForwardedSessionHeaders,
  mergeHeaders,
} from "@/lib/server/lms-sls";

export async function POST(request: Request) {
  try {
    const access = await requireAdminApiAccess(request);

    if (!access.ok) {
      return access.response;
    }

    const body = (await request.json()) as unknown;
    const idempotencyKey = request.headers.get("idempotency-key")?.trim();
    const headers = mergeHeaders(
      createTrustedAdminHeaders(access.admin),
      getForwardedSessionHeaders(request.headers),
    );

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { error: "Request body must be a JSON object." },
        { status: 400 },
      );
    }

    const incomingUrl = new URL(request.url);

    if (idempotencyKey) {
      headers.set("idempotency-key", idempotencyKey);
    }

    return await forwardLmsSlsRequest({
      body: JSON.stringify(body),
      contentType: "application/json",
      headers,
      method: "POST",
      path: "/api/monobank/invoice",
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
