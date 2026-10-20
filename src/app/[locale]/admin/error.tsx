"use client";

import { SectionError } from "@/components/shell/section-error";

export default function SectionErrorPage({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return <SectionError error={error} retry={unstable_retry} />;
}
