"use client";

import dynamic from "next/dynamic";

export const LazyLectureReader = dynamic(
  () =>
    import("@/components/cabinet/lecture-reader").then(
      (m) => m.LectureReader,
    ),
  { ssr: false },
);
