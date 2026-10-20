"use client";

import { Eye, Trash2, Upload as UploadIcon, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { type ChangeEvent, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { LessonVideoPlayer } from "@/components/cabinet/lesson-video-player";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AdminVideoRow, AdminVideosOverview } from "@/lib/server/lectures";
import type { VideoPlayback } from "@/lib/server/video/types";

import { requestJson } from "./request-json";
import { VideoStateBadge } from "./VideoStateBadge";
import { videoUploaders } from "./video-uploaders";

const POLL_INTERVAL_MS = 10_000;

interface ActiveUpload {
  lectureId: string;
  progress: number;
  controller: AbortController;
}

export function VideosManager({
  initialOverview,
}: {
  initialOverview: AdminVideosOverview;
}) {
  const t = useTranslations("admin.videos");
  const [overview, setOverview] = useState(initialOverview);
  const [activeUpload, setActiveUpload] = useState<ActiveUpload | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminVideoRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [preview, setPreview] = useState<{
    title: string;
    playback: VideoPlayback;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileTargetRef = useRef<AdminVideoRow | null>(null);

  const { provider, lectures } = overview;

  async function refresh() {
    try {
      setOverview(await requestJson<AdminVideosOverview>("/api/admin/videos"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("errors.generic"));
    }
  }

  // Only providers that encode (not Blob) ever report "processing".
  const hasProcessing = lectures.some((l) => l.video?.state === "processing");

  useEffect(() => {
    if (!hasProcessing) return;
    const timer = setInterval(() => {
      if (document.visibilityState !== "visible") return;
      requestJson<AdminVideosOverview>("/api/admin/videos")
        .then(setOverview)
        .catch(() => {});
    }, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [hasProcessing]);

  useEffect(() => {
    if (!activeUpload) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [activeUpload]);

  function pickFile(row: AdminVideoRow) {
    fileTargetRef.current = row;
    fileInputRef.current?.click();
  }

  // Upload straight to the provider, then attach the result to the lecture.
  // Nothing is attached until the upload finishes, so cancel or error leaves
  // the lecture as it was.
  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    const row = fileTargetRef.current;
    event.target.value = "";
    if (!file || !row || !provider || activeUpload) return;

    const controller = new AbortController();
    setActiveUpload({ lectureId: row.id, progress: 0, controller });
    try {
      const { videoId } = await videoUploaders[provider]({
        file,
        lectureId: row.id,
        signal: controller.signal,
        onProgress: (fraction) =>
          setActiveUpload((current) =>
            current?.controller === controller
              ? { ...current, progress: fraction }
              : current,
          ),
      });
      await requestJson(`/api/admin/videos?id=${row.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId }),
      });
      toast.success(t("success.uploaded"));
      await refresh();
    } catch (error) {
      if (controller.signal.aborted) toast.info(t("success.canceled"));
      else
        toast.error(
          t("errors.upload", {
            message: error instanceof Error ? error.message : "",
          }),
        );
    } finally {
      setActiveUpload(null);
    }
  }

  async function handlePreview(row: AdminVideoRow) {
    try {
      const playback = await requestJson<VideoPlayback>(
        `/api/admin/videos/playback?id=${row.id}`,
      );
      setPreview({ title: row.title, playback });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("errors.generic"));
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await requestJson(`/api/admin/videos?id=${deleteTarget.id}`, {
        method: "DELETE",
      });
      toast.success(t("success.deleted"));
      setDeleteTarget(null);
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("errors.generic"));
    } finally {
      setIsDeleting(false);
    }
  }

  function renderState(row: AdminVideoRow) {
    if (activeUpload?.lectureId !== row.id)
      return (
        <VideoStateBadge hasVideo={row.videoId !== null} status={row.video} />
      );

    const percent = Math.round(activeUpload.progress * 100);
    return (
      <div className="flex min-w-48 items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-primary transition-[width]"
            style={{ width: `${percent}%` }}
          />
        </div>
        <span className="w-9 text-right font-mono text-xs">{percent}%</span>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => activeUpload.controller.abort()}
          aria-label={t("actions.cancel")}
          title={t("actions.cancel")}
        >
          <X className="size-3.5" />
        </Button>
      </div>
    );
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={handleFile}
      />

      <Card className="shadow-xs">
        <CardHeader className="border-b px-3 sm:px-6">
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>

        <CardContent className="p-0">
          {!provider && (
            <div className="border-b bg-muted/40 px-3 py-3 text-sm text-muted-foreground sm:px-6">
              {t("notConnected")}
            </div>
          )}
          {lectures.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              {t("empty")}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-3 sm:pl-6">
                    {t("columns.title")}
                  </TableHead>
                  <TableHead>{t("columns.state")}</TableHead>
                  <TableHead className="pr-3 text-right sm:pr-6">
                    {t("columns.actions")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lectures.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="pl-3 sm:pl-6">
                      <p className="font-medium">{row.title}</p>
                      <code className="text-xs text-muted-foreground">
                        {row.slug}
                      </code>
                    </TableCell>
                    <TableCell>{renderState(row)}</TableCell>
                    <TableCell className="pr-3 text-right sm:pr-6">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5"
                          onClick={() => pickFile(row)}
                          disabled={!provider || activeUpload !== null}
                        >
                          <UploadIcon className="size-3.5" />
                          {row.videoId
                            ? t("actions.replace")
                            : t("actions.upload")}
                        </Button>
                        {row.videoId && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => handlePreview(row)}
                              disabled={!provider}
                              aria-label={t("actions.preview")}
                              title={t("actions.preview")}
                            >
                              <Eye className="size-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => setDeleteTarget(row)}
                              disabled={activeUpload?.lectureId === row.id}
                              aria-label={t("actions.delete")}
                              title={t("actions.delete")}
                            >
                              <Trash2 className="size-3.5 text-destructive" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={preview !== null}
        onOpenChange={(open) => {
          if (!open) setPreview(null);
        }}
      >
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{preview?.title}</DialogTitle>
          </DialogHeader>
          {preview && (
            <LessonVideoPlayer
              playback={preview.playback}
              title={preview.title}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setDeleteTarget(null);
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("dialogs.delete.title")}</DialogTitle>
            <DialogDescription>
              {t("dialogs.delete.description", {
                name: deleteTarget?.title ?? "",
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={isDeleting}
            >
              {t("dialogs.delete.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting
                ? t("dialogs.delete.deleting")
                : t("dialogs.delete.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
