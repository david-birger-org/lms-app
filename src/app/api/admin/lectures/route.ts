import { NextResponse } from "next/server";

import { ADMIN_LECTURES_PATH, lmsSlsJson } from "@/lib/server/lectures";
import {
  createProxyRoute,
  resolveProxyHeaders,
} from "@/lib/server/proxy-route";
import { deleteVideoBestEffort } from "@/lib/server/video";

const PATH = ADMIN_LECTURES_PATH;

export const GET = createProxyRoute({
  auth: "admin",
  method: "GET",
  path: PATH,
  errorMessage: "Failed to fetch lectures",
});

export const POST = createProxyRoute({
  auth: "admin",
  method: "POST",
  path: PATH,
  forwardBody: true,
  errorMessage: "Failed to create lecture",
});

export const PUT = createProxyRoute({
  auth: "admin",
  method: "PUT",
  path: PATH,
  forwardBody: true,
  search: "incoming",
  errorMessage: "Failed to update lecture",
});

// Deletes the lecture in lms-sls, then its video at the provider.
export async function DELETE(request: Request) {
  try {
    const resolved = await resolveProxyHeaders("admin", request);
    if (!resolved.ok) return resolved.response;

    const result = await lmsSlsJson<{ videoId?: string | null }>(
      resolved.headers,
      { method: "DELETE", path: PATH, search: new URL(request.url).search },
    );
    if (!result.ok) return result.response;

    await deleteVideoBestEffort(result.data.videoId ?? null);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json(
      { error: `Failed to delete lecture: ${message}` },
      { status: 500 },
    );
  }
}
