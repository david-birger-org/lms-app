import { NextResponse } from "next/server";

import {
  ADMIN_LECTURES_PATH,
  type AdminLectureRecord,
  lmsSlsJson,
} from "@/lib/server/lectures";
import { resolveProxyHeaders } from "@/lib/server/proxy-route";
import { getVideoProvider } from "@/lib/server/video";

// Signed playback for the admin preview.
export async function GET(request: Request) {
  try {
    const resolved = await resolveProxyHeaders("admin", request);
    if (!resolved.ok) return resolved.response;

    const id = new URL(request.url).searchParams.get("id");
    const provider = getVideoProvider();
    if (!provider)
      return NextResponse.json(
        { error: "Video hosting is not connected." },
        { status: 400 },
      );

    const result = await lmsSlsJson<{ lectures?: AdminLectureRecord[] }>(
      resolved.headers,
      { method: "GET", path: ADMIN_LECTURES_PATH },
    );
    if (!result.ok) return result.response;

    const videoId = result.data.lectures?.find((l) => l.id === id)?.videoId;
    if (!videoId)
      return NextResponse.json({ error: "No video." }, { status: 404 });

    return NextResponse.json(await provider.playback(videoId));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json(
      { error: `Failed to load video playback: ${message}` },
      { status: 500 },
    );
  }
}
