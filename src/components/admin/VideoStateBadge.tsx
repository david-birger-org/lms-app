"use client";

import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import type { VideoStatus } from "@/lib/server/video/types";

export function VideoStateBadge({
  hasVideo,
  status,
}: {
  hasVideo: boolean;
  status: VideoStatus | null;
}) {
  const t = useTranslations("admin.videos.state");

  if (!hasVideo)
    return <span className="text-sm text-muted-foreground">{t("none")}</span>;
  if (!status) return <Badge variant="outline">{t("unknown")}</Badge>;

  switch (status.state) {
    case "ready":
      return <Badge>{t("ready")}</Badge>;
    case "processing":
      return (
        <Badge variant="secondary">
          {status.progress === undefined
            ? t("processing")
            : t("processingProgress", {
                progress: Math.round(status.progress * 100),
              })}
        </Badge>
      );
    case "failed":
      return <Badge variant="destructive">{t("failed")}</Badge>;
    case "missing":
      return <Badge variant="destructive">{t("missing")}</Badge>;
  }
}
