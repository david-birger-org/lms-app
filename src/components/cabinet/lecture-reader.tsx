"use client";

import { useCallback, useMemo, useState } from "react";
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
          className="whitespace-nowrap text-sm font-medium text-foreground/[0.04] dark:text-foreground/[0.06]"
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
    // biome-ignore lint/a11y/noStaticElementInteractions: intentional anti-copy protection
    <div
      className="relative"
      onContextMenu={(e) => e.preventDefault()}
      onCopy={(e) => e.preventDefault()}
    >
      <WatermarkOverlay text={watermarkText} />
      <div className="flex select-none flex-col items-center gap-4">
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
              width={800}
              className="mb-4 shadow-sm"
              renderTextLayer={false}
              renderAnnotationLayer={false}
            />
          ))}
        </Document>
      </div>
    </div>
  );
}
