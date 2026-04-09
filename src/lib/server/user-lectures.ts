import "server-only";

import { headers as getRequestHeaders } from "next/headers";

import { requireAuthPageAccess } from "@/lib/auth/auth-server";
import {
  forwardLmsSlsRequest,
  getForwardedSessionHeaders,
  mergeHeaders,
} from "@/lib/server/lms-sls";
import { createTrustedUserHeaders } from "@/lib/server/lms-sls-user";

export interface LectureSummary {
  slug: string;
  title: string;
  description: string | null;
  coverImageUrl: string | null;
}

export interface LectureDetail extends LectureSummary {
  pdfBase64: string;
}

interface LecturesListResponse {
  error?: string;
  lectures?: LectureSummary[];
}

interface LectureDetailResponse {
  error?: string;
  lecture?: LectureDetail;
}

export async function listUserLectures(): Promise<LectureSummary[]> {
  const access = await requireAuthPageAccess();
  const requestHeaders = await getRequestHeaders();

  const response = await forwardLmsSlsRequest({
    headers: mergeHeaders(
      createTrustedUserHeaders(access.authenticatedUser),
      getForwardedSessionHeaders(requestHeaders),
    ),
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

export async function getUserLecture(
  slug: string,
): Promise<LectureDetail | null> {
  const access = await requireAuthPageAccess();
  const requestHeaders = await getRequestHeaders();

  const response = await forwardLmsSlsRequest({
    headers: mergeHeaders(
      createTrustedUserHeaders(access.authenticatedUser),
      getForwardedSessionHeaders(requestHeaders),
    ),
    method: "GET",
    path: "/api/user/lectures",
    search: `?slug=${encodeURIComponent(slug)}`,
  });

  if (response.status === 403 || response.status === 404) return null;

  const payload = (await response
    .json()
    .catch(() => null)) as LectureDetailResponse | null;

  if (!response.ok)
    throw new Error(payload?.error ?? "Failed to fetch lecture.");

  return payload?.lecture ?? null;
}

export async function hasLecturesAccess(): Promise<boolean> {
  const access = await requireAuthPageAccess();
  const requestHeaders = await getRequestHeaders();

  const response = await forwardLmsSlsRequest({
    headers: mergeHeaders(
      createTrustedUserHeaders(access.authenticatedUser),
      getForwardedSessionHeaders(requestHeaders),
    ),
    method: "GET",
    path: "/api/user/lectures",
  });

  return response.status !== 403;
}
