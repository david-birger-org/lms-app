import "server-only";

import { env } from "@/lib/env";

import type { VideoProvider } from "./types";
import { vercelBlobProvider } from "./vercel-blob";

// null when VIDEO_PROVIDER is unset: video hosting is not connected yet.
export function getVideoProvider(): VideoProvider | null {
  const name = env.videoProvider;
  if (!name) return null;
  if (name === vercelBlobProvider.name) return vercelBlobProvider;
  throw new Error(`Unknown VIDEO_PROVIDER "${name}".`);
}

// Cleanup of a replaced or orphaned video. Failures are logged, not thrown,
// because the lecture change already succeeded.
export async function deleteVideoBestEffort(videoId: string | null) {
  if (!videoId) return;
  try {
    await getVideoProvider()?.delete(videoId);
  } catch (error) {
    console.error(`Failed to delete video ${videoId}`, error);
  }
}
