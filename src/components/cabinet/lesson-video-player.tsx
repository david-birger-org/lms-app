"use client";

import type { VideoPlayback } from "@/lib/server/video/types";
import { cn } from "@/lib/utils";

// Student lesson player. Also used for the admin preview. The watermark is a
// faint overlay with the viewer's email.
export function LessonVideoPlayer({
  className,
  playback,
  title,
  watermark,
}: {
  className?: string;
  playback: VideoPlayback;
  title: string;
  watermark?: string | null;
}) {
  return (
    <div
      className={cn(
        "relative aspect-video w-full overflow-hidden rounded-lg bg-black",
        className,
      )}
    >
      {playback.type === "file" ? (
        // biome-ignore lint/a11y/useMediaCaption: lessons have no caption tracks
        <video
          src={playback.url}
          title={title}
          className="absolute inset-0 size-full"
          controls
          controlsList="nodownload"
          disablePictureInPicture
          playsInline
          preload="metadata"
          onContextMenu={(event) => event.preventDefault()}
        />
      ) : (
        <iframe
          src={playback.url}
          title={title}
          className="absolute inset-0 size-full border-0"
          allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
          loading="lazy"
        />
      )}
      {watermark ? (
        <span className="pointer-events-none absolute top-3 right-3 font-numeric text-[11px] text-white/40 select-none">
          {watermark}
        </span>
      ) : null}
    </div>
  );
}
