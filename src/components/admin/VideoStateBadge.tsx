"use client";

import { useTranslations } from "next-intl";

import { StatusBadge } from "@/components/shell/status-badge";
import type { VideoStatus } from "@/lib/server/video/types";

export function VideoStateBadge({
  hasVideo,
  status,
}: {
  hasVideo: boolean;
  status: VideoStatus | null;
}) {
  const t = useTranslations("admin.videos.state");

  if (!hasVideo) return <StatusBadge status="neutral">{t("none")}</StatusBadge>;
  if (!status)
    return <StatusBadge status="neutral">{t("unknown")}</StatusBadge>;

  switch (status.state) {
    case "ready":
      return <StatusBadge status="success">{t("ready")}</StatusBadge>;
    case "processing":
      return (
        <StatusBadge status="warning">
          {status.progress === undefined
            ? t("processing")
            : t("processingProgress", {
                progress: Math.round(status.progress * 100),
              })}
        </StatusBadge>
      );
    case "failed":
      return <StatusBadge status="error">{t("failed")}</StatusBadge>;
    case "missing":
      return <StatusBadge status="error">{t("missing")}</StatusBadge>;
  }
}
