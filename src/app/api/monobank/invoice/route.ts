import { NextResponse } from "next/server";

import { requireAdminApiAccess } from "@/lib/auth/admin-server";
import {
  forwardLmsSlsRequest,
  getForwardedAuthHeaders,
} from "@/lib/server/lms-sls";

function getAppUserId(privateMetadata: unknown) {
  if (!privateMetadata || typeof privateMetadata !== "object") {
    return null;
  }

  const userId = Reflect.get(privateMetadata, "userId");

  return typeof userId === "string" ? userId.trim() || null : null;
}

export async function POST(request: Request) {
  const access = await requireAdminApiAccess({ includeUser: true });

  if (!access.ok) {
    return access.response;
  }

  try {
    const body = (await request.json()) as unknown;
    const idempotencyKey = request.headers.get("idempotency-key")?.trim();
    const headers = getForwardedAuthHeaders(request.headers);

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
      body: JSON.stringify({
        ...body,
        appUserId: getAppUserId(access.user?.privateMetadata),
        clerkUserId: access.userId,
        customerEmail: access.user?.primaryEmailAddress?.emailAddress ?? null,
      }),
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
