import { NextResponse } from "next/server";

import {
  ADMIN_LECTURES_PATH,
  type AdminLectureRecord,
  buildVideosOverview,
  lmsSlsJson,
} from "@/lib/server/lectures";
import { resolveProxyHeaders } from "@/lib/server/proxy-route";
import { deleteVideoBestEffort, getVideoProvider } from "@/lib/server/video";

const VIDEO_PATH = `${ADMIN_LECTURES_PATH}/video`;

interface VideoChangeResponse {
  lecture: AdminLectureRecord;
  previousVideoId?: string | null;
}

function errorResponse(prefix: string, error: unknown) {
  const message = error instanceof Error ? error.message : "Unexpected error";
  return NextResponse.json({ error: `${prefix}: ${message}` }, { status: 500 });
}

function badRequest(error: string) {
  return NextResponse.json({ error }, { status: 400 });
}

export async function GET(request: Request) {
  try {
    const resolved = await resolveProxyHeaders("admin", request);
    if (!resolved.ok) return resolved.response;

    const result = await lmsSlsJson<{ lectures?: AdminLectureRecord[] }>(
      resolved.headers,
      { method: "GET", path: ADMIN_LECTURES_PATH },
    );
    if (!result.ok) return result.response;

    return NextResponse.json(
      await buildVideosOverview(result.data.lectures ?? []),
    );
  } catch (error) {
    return errorResponse("Failed to fetch videos", error);
  }
}

// Attaches an uploaded video to a lecture and removes the one it replaces.
export async function PUT(request: Request) {
  try {
    const resolved = await resolveProxyHeaders("admin", request);
    if (!resolved.ok) return resolved.response;

    const id = new URL(request.url).searchParams.get("id")?.trim();
    if (!id) return badRequest("Missing id.");

    const body = (await request.json().catch(() => null)) as {
      videoId?: unknown;
    } | null;
    const videoId = body?.videoId;
    if (typeof videoId !== "string" || !videoId.startsWith(`lectures/${id}/`))
      return badRequest("Invalid videoId for this lecture.");

    const provider = getVideoProvider();
    if (!provider) return badRequest("Video hosting is not connected.");
    const status = await provider.status(videoId);
    if (status.state === "missing")
      return badRequest("The uploaded video was not found.");

    const result = await lmsSlsJson<VideoChangeResponse>(resolved.headers, {
      method: "PUT",
      path: VIDEO_PATH,
      search: `?id=${encodeURIComponent(id)}`,
      body: { videoId },
    });
    if (!result.ok) return result.response;

    const previous = result.data.previousVideoId ?? null;
    if (previous !== videoId) await deleteVideoBestEffort(previous);

    return NextResponse.json({ lecture: result.data.lecture });
  } catch (error) {
    return errorResponse("Failed to attach video", error);
  }
}

export async function DELETE(request: Request) {
  try {
    const resolved = await resolveProxyHeaders("admin", request);
    if (!resolved.ok) return resolved.response;

    const result = await lmsSlsJson<VideoChangeResponse>(resolved.headers, {
      method: "DELETE",
      path: VIDEO_PATH,
      search: new URL(request.url).search,
    });
    if (!result.ok) return result.response;

    await deleteVideoBestEffort(result.data.previousVideoId ?? null);
    return NextResponse.json({ lecture: result.data.lecture });
  } catch (error) {
    return errorResponse("Failed to delete video", error);
  }
}
