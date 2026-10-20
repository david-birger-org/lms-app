import { upload } from "@vercel/blob/client";

import type { VideoProviderName } from "@/lib/server/video/types";

export type VideoUploader = (args: {
  file: File;
  lectureId: string;
  onProgress(fraction: number): void;
  signal: AbortSignal;
}) => Promise<{ videoId: string }>;

// Browser-side upload per provider. Each returns the provider's video
// reference, which the page then attaches with PUT /api/admin/videos.
export const videoUploaders: Record<VideoProviderName, VideoUploader> = {
  "vercel-blob": async ({ file, lectureId, onProgress, signal }) => {
    const blob = await upload(`lectures/${lectureId}/${file.name}`, file, {
      access: "private",
      handleUploadUrl: "/api/admin/videos/upload/vercel-blob",
      multipart: true,
      contentType: file.type,
      onUploadProgress: (event) => onProgress(event.percentage / 100),
      abortSignal: signal,
    });
    return { videoId: blob.pathname };
  },
};
