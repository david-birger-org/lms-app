import { NextResponse } from "next/server";

import { requireAdminApiAccess } from "@/lib/auth/admin-server";
import {
  createTrustedAdminHeaders,
  forwardLmsSlsRequest,
  getForwardedSessionHeaders,
  mergeHeaders,
} from "@/lib/server/lms-sls";

export async function GET(request: Request) {
  try {
    const access = await requireAdminApiAccess(request);
    if (!access.ok) return access.response;

    return await forwardLmsSlsRequest({
      headers: mergeHeaders(
        createTrustedAdminHeaders(access.admin),
        getForwardedSessionHeaders(request.headers),
      ),
      method: "GET",
      path: "/api/contact-requests/admin",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json(
      { error: `Failed to fetch contact requests: ${message}` },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const access = await requireAdminApiAccess(request);
    if (!access.ok) return access.response;

    const url = new URL(request.url);
    const body = await request.text();

    return await forwardLmsSlsRequest({
      body,
      contentType: "application/json",
      headers: mergeHeaders(
        createTrustedAdminHeaders(access.admin),
        getForwardedSessionHeaders(request.headers),
      ),
      method: "PUT",
      path: "/api/contact-requests/admin",
      search: url.search,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json(
      { error: `Failed to update contact request: ${message}` },
      { status: 500 },
    );
  }
}
