import "server-only";

import { headers as getRequestHeaders } from "next/headers";

import { requireAdminPageAccess } from "@/lib/auth/admin-server";
import {
  createTrustedAdminHeaders,
  forwardLmsSlsRequest,
  getForwardedSessionHeaders,
  mergeHeaders,
} from "@/lib/server/lms-sls";
import { getVideoProvider } from "@/lib/server/video";
import type { VideoProviderName, VideoStatus } from "@/lib/server/video/types";

export const ADMIN_LECTURES_PATH = "/api/lectures/admin";

export interface AdminLectureRecord {
  active: boolean;
  coverImageUrl: string | null;
  createdAt: string;
  description: string | null;
  hasNotes: boolean;
  id: string;
  notesSize: number;
  slug: string;
  sortOrder: number;
  title: string;
  updatedAt: string;
  videoId: string | null;
}

export interface AdminVideoRow {
  active: boolean;
  id: string;
  slug: string;
  sortOrder: number;
  title: string;
  // null when there is no video, or its status could not be read.
  video: VideoStatus | null;
  videoId: string | null;
}

export interface AdminVideosOverview {
  lectures: AdminVideoRow[];
  provider: VideoProviderName | null;
}

type LmsSlsJsonResult<T> =
  | { ok: true; data: T }
  | { ok: false; response: Response };

// Calls lms-sls and parses JSON. A non-2xx answer is passed through as is.
export async function lmsSlsJson<T>(
  headers: Headers,
  options: { method: string; path: string; search?: string; body?: unknown },
): Promise<LmsSlsJsonResult<T>> {
  const hasBody = options.body !== undefined;
  const response = await forwardLmsSlsRequest({
    body: hasBody ? JSON.stringify(options.body) : undefined,
    contentType: hasBody ? "application/json" : undefined,
    headers,
    method: options.method,
    path: options.path,
    search: options.search,
  });
  if (!response.ok) return { ok: false, response };
  return { ok: true, data: (await response.json()) as T };
}

export async function listAdminLectures(): Promise<AdminLectureRecord[]> {
  const access = await requireAdminPageAccess();
  const requestHeaders = await getRequestHeaders();
  const result = await lmsSlsJson<{ lectures?: AdminLectureRecord[] }>(
    mergeHeaders(
      createTrustedAdminHeaders(access.admin),
      getForwardedSessionHeaders(requestHeaders),
    ),
    { method: "GET", path: ADMIN_LECTURES_PATH },
  );

  if (!result.ok) {
    const payload = (await result.response.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new Error(payload?.error ?? "Failed to fetch lectures.");
  }

  return Array.isArray(result.data.lectures) ? result.data.lectures : [];
}

// Adds provider status to each lecture that has a video.
export async function buildVideosOverview(
  lectures: AdminLectureRecord[],
): Promise<AdminVideosOverview> {
  const provider = getVideoProvider();
  const rows = await Promise.all(
    [...lectures]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map(async (lecture): Promise<AdminVideoRow> => {
        let video: VideoStatus | null = null;
        if (provider && lecture.videoId) {
          video = await provider.status(lecture.videoId).catch((error) => {
            console.error(`Failed to read video ${lecture.videoId}`, error);
            return null;
          });
        }
        return {
          active: lecture.active,
          id: lecture.id,
          slug: lecture.slug,
          sortOrder: lecture.sortOrder,
          title: lecture.title,
          video,
          videoId: lecture.videoId,
        };
      }),
  );
  return { lectures: rows, provider: provider?.name ?? null };
}
