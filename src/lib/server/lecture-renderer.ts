import "server-only";

import { createCanvas } from "@napi-rs/canvas";
import { LRUCache } from "lru-cache";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

import type { AuthenticatedUser } from "@/lib/auth/auth-server";
import { forwardLmsSlsRequest, mergeHeaders } from "@/lib/server/lms-sls";
import { createTrustedUserHeaders } from "@/lib/server/lms-sls-user";
import { fetchUserLectures } from "@/lib/server/user-lectures";

const RENDER_SCALE = 3;
const CACHE_MAX = 10;
const CACHE_TTL_MS = 30 * 60 * 1000;

interface PreparedLecture {
  pageCount: number;
  pageWidth: number;
  pageHeight: number;
  renderPage: (index: number) => Promise<Buffer>;
}

const cache = new LRUCache<string, Promise<PreparedLecture>>({
  max: CACHE_MAX,
  ttl: CACHE_TTL_MS,
});

async function fetchPdfBytes(
  slug: string,
  user: AuthenticatedUser,
): Promise<Uint8Array> {
  const response = await forwardLmsSlsRequest({
    headers: mergeHeaders(createTrustedUserHeaders(user)),
    method: "GET",
    path: "/api/user/lectures",
    search: `?slug=${encodeURIComponent(slug)}`,
  });

  if (response.status === 404) throw new Error("not-found");
  if (!response.ok)
    throw new Error(`lms-sls returned ${response.status} for lecture ${slug}`);

  const buffer = await response.arrayBuffer();
  return new Uint8Array(buffer);
}

async function prepare(
  slug: string,
  user: AuthenticatedUser,
): Promise<PreparedLecture> {
  const bytes = await fetchPdfBytes(slug, user);
  const doc = await pdfjsLib.getDocument({
    data: bytes,
    isEvalSupported: false,
    useSystemFonts: true,
  }).promise;

  const firstPage = await doc.getPage(1);
  const firstViewport = firstPage.getViewport({ scale: 1 });

  const renderPage = async (index: number) => {
    const page = await doc.getPage(index + 1);
    const viewport = page.getViewport({ scale: RENDER_SCALE });
    const canvas = createCanvas(viewport.width, viewport.height);
    await page.render({
      canvas: canvas as unknown as HTMLCanvasElement,
      viewport,
    }).promise;
    return canvas.toBuffer("image/png");
  };

  return {
    pageCount: doc.numPages,
    pageWidth: firstViewport.width,
    pageHeight: firstViewport.height,
    renderPage,
  };
}

// The cache is shared across users, so check this user's access on every
// call. Keying by updatedAt drops stale renders when notes are replaced.
async function prepareCached(
  slug: string,
  user: AuthenticatedUser,
): Promise<PreparedLecture> {
  const lecture = (await fetchUserLectures(user)).find((l) => l.slug === slug);
  if (!lecture?.hasNotes) throw new Error("not-found");

  const key = `${slug}:${lecture.updatedAt}`;
  const existing = cache.get(key);
  if (existing) return existing;
  const promise = prepare(slug, user).catch((err) => {
    cache.delete(key);
    throw err;
  });
  cache.set(key, promise);
  return promise;
}

export async function getLectureMeta(slug: string, user: AuthenticatedUser) {
  const { pageCount, pageWidth, pageHeight } = await prepareCached(slug, user);
  return { pageCount, pageWidth, pageHeight };
}

export async function renderLecturePage(
  slug: string,
  user: AuthenticatedUser,
  index: number,
): Promise<Buffer> {
  const lecture = await prepareCached(slug, user);
  if (index < 0 || index >= lecture.pageCount) {
    throw new Error("page-out-of-range");
  }
  return lecture.renderPage(index);
}
