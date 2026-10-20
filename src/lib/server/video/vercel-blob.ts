import "server-only";

import {
  BlobNotFoundError,
  del,
  head,
  issueSignedToken,
  presignUrl,
} from "@vercel/blob";

import type { VideoProvider } from "./types";

const PLAYBACK_TTL_MS = 4 * 60 * 60 * 1000;

// videoId is the blob pathname, e.g. "lectures/<lectureId>/<file>-<suffix>.mp4".
export const vercelBlobProvider: VideoProvider = {
  name: "vercel-blob",

  async status(videoId) {
    try {
      await head(videoId);
      return { state: "ready" };
    } catch (error) {
      if (error instanceof BlobNotFoundError) return { state: "missing" };
      throw error;
    }
  },

  async playback(videoId) {
    const validUntil = Date.now() + PLAYBACK_TTL_MS;
    const token = await issueSignedToken({
      pathname: videoId,
      operations: ["get"],
      validUntil,
    });
    const { presignedUrl } = await presignUrl(token, {
      operation: "get",
      pathname: videoId,
      access: "private",
      validUntil,
    });
    return { type: "file", url: presignedUrl, expiresAt: validUntil };
  },

  async delete(videoId) {
    try {
      await del(videoId);
    } catch (error) {
      if (error instanceof BlobNotFoundError) return;
      throw error;
    }
  },
};
