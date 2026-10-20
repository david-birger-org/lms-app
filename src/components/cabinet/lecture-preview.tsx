"use client";

import { Minus, Plus } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const WATERMARK_COLS = 4;
const WATERMARK_ROWS = 3;
const WATERMARK_TILES = WATERMARK_COLS * WATERMARK_ROWS;

const ZOOM_MIN = 50;
const ZOOM_MAX = 200;
const ZOOM_STEP = 10;
const ZOOM_DEFAULT = 100;

function WatermarkOverlay({ text }: { text: string }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 grid select-none"
      style={{
        gridTemplateColumns: `repeat(${WATERMARK_COLS}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${WATERMARK_ROWS}, minmax(0, 1fr))`,
      }}
    >
      {Array.from({ length: WATERMARK_TILES }, (_, i) => (
        <div
          key={`watermark-${i}`}
          className="flex items-center justify-center overflow-hidden"
        >
          <span
            className="whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.2em] text-foreground/25 sm:text-xs md:text-sm"
            style={{ transform: "rotate(-30deg)" }}
          >
            {text}
          </span>
        </div>
      ))}
    </div>
  );
}

function LecturePage({
  slug,
  index,
  aspectRatio,
  watermarkText,
}: {
  slug: string;
  index: number;
  aspectRatio: number;
  watermarkText: string;
}) {
  const [loaded, setLoaded] = useState(false);
  const src = `/api/user/lectures/page?slug=${encodeURIComponent(slug)}&index=${index}`;

  return (
    <div
      className="relative mx-auto w-full overflow-hidden rounded-lg bg-muted shadow-card ring-1 ring-foreground/10"
      style={{ aspectRatio }}
    >
      {!loaded && (
        <Skeleton className="absolute inset-0 h-full w-full rounded-lg" />
      )}
      <img
        alt=""
        src={src}
        draggable={false}
        loading={index < 2 ? "eager" : "lazy"}
        onLoad={() => setLoaded(true)}
        className={cn(
          "pointer-events-none absolute inset-0 h-full w-full select-none object-contain",
          loaded ? "opacity-100" : "opacity-0",
        )}
        style={{ WebkitUserDrag: "none" } as React.CSSProperties}
      />
      <WatermarkOverlay text={watermarkText} />
    </div>
  );
}

function ZoomToolbar({
  zoom,
  onChange,
}: {
  zoom: number;
  onChange: (value: number) => void;
}) {
  const clamp = (value: number) =>
    Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round(value)));

  return (
    // Sits below the site header, and on mobile below the lesson title bar.
    <div className="sticky top-[calc(var(--header-height)+3.5rem)] z-20 mx-auto flex w-fit items-center gap-1 rounded-[10px] border bg-background/90 p-1 shadow-menu backdrop-blur-md md:top-[calc(var(--header-height)+0.5rem)] md:gap-2">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Zoom out"
        disabled={zoom <= ZOOM_MIN}
        onClick={() => onChange(clamp(zoom - ZOOM_STEP))}
        className="size-10 md:size-8"
      >
        <Minus className="size-3.5" />
      </Button>
      <input
        type="range"
        aria-label="Zoom"
        min={ZOOM_MIN}
        max={ZOOM_MAX}
        step={ZOOM_STEP}
        value={zoom}
        onChange={(e) => onChange(clamp(Number(e.target.value)))}
        className="h-1 w-28 cursor-pointer accent-foreground sm:w-40"
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Zoom in"
        disabled={zoom >= ZOOM_MAX}
        onClick={() => onChange(clamp(zoom + ZOOM_STEP))}
        className="size-10 md:size-8"
      >
        <Plus className="size-3.5" />
      </Button>
      <span className="w-11 pr-2 text-right font-numeric text-xs text-muted-foreground">
        {zoom}%
      </span>
    </div>
  );
}

export function LecturePreview({
  slug,
  pageCount,
  pageWidth,
  pageHeight,
  watermarkText,
}: {
  slug: string;
  pageCount: number;
  pageWidth: number;
  pageHeight: number;
  watermarkText: string;
}) {
  const aspectRatio = pageWidth / pageHeight;
  const [zoom, setZoom] = useState(ZOOM_DEFAULT);

  useEffect(() => {
    const block = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if ((e.ctrlKey || e.metaKey) && (k === "p" || k === "s")) {
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", block);
    return () => window.removeEventListener("keydown", block);
  }, []);

  return (
    <div
      className="flex flex-col gap-3 select-none print:hidden sm:gap-4"
      onContextMenu={(e) => e.preventDefault()}
      onCopy={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
    >
      <ZoomToolbar zoom={zoom} onChange={setZoom} />
      <div className="overflow-x-auto">
        <div
          className="mx-auto flex flex-col gap-3 sm:gap-4"
          style={{ width: `${zoom}%`, minWidth: `${ZOOM_MIN}%` }}
        >
          {Array.from({ length: pageCount }, (_, i) => (
            <LecturePage
              key={`${slug}-page-${i}`}
              slug={slug}
              index={i}
              aspectRatio={aspectRatio}
              watermarkText={watermarkText}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
