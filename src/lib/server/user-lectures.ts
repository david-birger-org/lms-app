import "server-only";

import { headers as getRequestHeaders } from "next/headers";

import {
  type AuthenticatedUser,
  requireAuthPageAccess,
} from "@/lib/auth/auth-server";
import {
  forwardLmsSlsRequest,
  getForwardedSessionHeaders,
  mergeHeaders,
} from "@/lib/server/lms-sls";
import { createTrustedUserHeaders } from "@/lib/server/lms-sls-user";
import { getVideoProvider } from "@/lib/server/video";
import type { VideoPlayback } from "@/lib/server/video/types";

export interface LectureSummary {
  slug: string;
  title: string;
  description: string | null;
  coverImageUrl: string | null;
  hasNotes: boolean;
  hasVideo: boolean;
  updatedAt: string;
}

interface LecturesListResponse {
  error?: string;
  lectures?: LectureSummary[];
}

// Lectures the user may open. Empty when the user lacks the `lectures`
// feature (lms-sls answers 403).
export async function fetchUserLectures(
  user: AuthenticatedUser,
  sessionHeaders?: Headers,
): Promise<LectureSummary[]> {
  const response = await forwardLmsSlsRequest({
    headers: mergeHeaders(createTrustedUserHeaders(user), sessionHeaders),
    method: "GET",
    path: "/api/user/lectures",
  });

  if (response.status === 403) return [];

  const payload = (await response
    .json()
    .catch(() => null)) as LecturesListResponse | null;

  if (!response.ok)
    throw new Error(payload?.error ?? "Failed to fetch lectures.");

  return Array.isArray(payload?.lectures) ? payload.lectures : [];
}

export async function listUserLectures(): Promise<LectureSummary[]> {
  const access = await requireAuthPageAccess();
  const requestHeaders = await getRequestHeaders();
  return fetchUserLectures(
    access.authenticatedUser,
    getForwardedSessionHeaders(requestHeaders),
  );
}

// Signed playback for the lecture video, or null when video hosting is not
// connected or the user has no video for this slug.
export async function getUserLectureVideo(
  slug: string,
): Promise<VideoPlayback | null> {
  const provider = getVideoProvider();
  if (!provider) return null;

  const access = await requireAuthPageAccess();
  const requestHeaders = await getRequestHeaders();

  const response = await forwardLmsSlsRequest({
    headers: mergeHeaders(
      createTrustedUserHeaders(access.authenticatedUser),
      getForwardedSessionHeaders(requestHeaders),
    ),
    method: "GET",
    path: "/api/user/lectures/video",
    search: `?slug=${encodeURIComponent(slug)}`,
  });

  if (response.status === 404 || response.status === 403) return null;

  const payload = (await response.json().catch(() => null)) as {
    videoId?: string;
    error?: string;
  } | null;

  if (!response.ok || !payload?.videoId)
    throw new Error(payload?.error ?? "Failed to fetch lecture video.");

  return provider.playback(payload.videoId);
}
