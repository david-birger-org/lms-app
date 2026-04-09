"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

function WatermarkOverlay({ text }: { text: string }) {
  const repeated = Array.from({ length: 20 }, () => text).join("   ");
  const rows = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] as const;

  return (
    <div
      className="pointer-events-none absolute inset-0 z-10 overflow-hidden"
      aria-hidden
    >
      {rows.map((i) => (
        <div
          key={`wm-${i}`}
          className="whitespace-nowrap text-lg font-semibold text-foreground/[0.12] dark:text-foreground/[0.15]"
          style={{
            transform: "rotate(-25deg)",
            transformOrigin: "0 0",
            marginTop: `${i * 120}px`,
            marginLeft: "-20%",
            width: "200%",
          }}
        >
          {repeated}
        </div>
      ))}
    </div>
  );
}

export function LectureReader({
  pdfBase64,
  watermarkText,
}: {
  pdfBase64: string;
  watermarkText: string;
}) {
  const [numPages, setNumPages] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(800);
  const [zoom, setZoom] = useState<number>(100);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width;
      if (width) setContainerWidth(width);
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const pageWidth = Math.min(containerWidth, 800) * (zoom / 100);

  const pdfData = useMemo(() => {
    const raw = atob(pdfBase64);
    const bytes = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
    return { data: bytes };
  }, [pdfBase64]);

  const onDocumentLoadSuccess = useCallback(
    ({ numPages: n }: { numPages: number }) => setNumPages(n),
    [],
  );

  return (
    <div ref={containerRef}>
      <div className="sticky top-0 z-20 mx-4 mb-4 flex items-center gap-3 rounded-lg bg-muted/80 px-3 py-2 backdrop-blur-sm md:mx-0">
        <label htmlFor="pdf-zoom" className="shrink-0 text-xs text-muted-foreground">
          {zoom}%
        </label>
        <input
          id="pdf-zoom"
          type="range"
          min={50}
          max={200}
          step={10}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-border accent-foreground"
        />
      </div>
      {/* biome-ignore lint/a11y/noStaticElementInteractions: intentional anti-copy protection */}
      <div
        className="relative max-w-full overflow-x-auto"
        onContextMenu={(e) => e.preventDefault()}
        onCopy={(e) => e.preventDefault()}
      >
        <WatermarkOverlay text={watermarkText} />
        <div className="select-none" style={{ width: pageWidth > containerWidth ? pageWidth : "100%" }}>
          <Document
            file={pdfData}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={
              <div className="flex h-[600px] items-center justify-center text-sm text-muted-foreground">
                Loading PDF...
              </div>
            }
          >
            {Array.from({ length: numPages }, (_, i) => (
              <Page
                key={`page-${i + 1}`}
                pageNumber={i + 1}
                width={pageWidth}
                className="mx-auto mb-4 shadow-sm"
                renderTextLayer={false}
                renderAnnotationLayer={false}
              />
            ))}
          </Document>
        </div>
      </div>
    </div>
  );
}
