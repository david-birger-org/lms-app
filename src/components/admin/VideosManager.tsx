"use client";

import {
  CircleAlert,
  Eye,
  Film,
  MoreHorizontal,
  Trash2,
  Upload as UploadIcon,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { type ChangeEvent, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { LessonVideoPlayer } from "@/components/cabinet/lesson-video-player";
import { DataList, type DataListColumn } from "@/components/shell/data-list";
import { EmptyState } from "@/components/shell/empty-state";
import { StatusBadge } from "@/components/shell/status-badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link } from "@/i18n/routing";
import type { AdminVideoRow, AdminVideosOverview } from "@/lib/server/lectures";
import type { VideoPlayback } from "@/lib/server/video/types";
import { cn } from "@/lib/utils";

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

  const uploadingRow = activeUpload
    ? lectures.find((row) => row.id === activeUpload.lectureId)
    : undefined;
  const percent = activeUpload ? Math.round(activeUpload.progress * 100) : 0;

  function renderProgress(className?: string) {
    if (!activeUpload) return null;
    return (
      <div className={cn("flex items-center gap-3", className)}>
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          aria-label={t("uploading", { title: uploadingRow?.title ?? "" })}
          className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"
        >
          <div
            className="h-full origin-left bg-primary transition-transform duration-150 ease-out"
            style={{ transform: `scaleX(${activeUpload.progress})` }}
          />
        </div>
        <span className="font-numeric w-10 text-right text-xs">{percent}%</span>
        <Button
          variant="ghost"
          size="icon"
          className="size-10 md:size-8"
          onClick={() => activeUpload.controller.abort()}
          aria-label={t("actions.cancel")}
          title={t("actions.cancel")}
        >
          <X />
        </Button>
      </div>
    );
  }

  const columns: DataListColumn<AdminVideoRow>[] = [
    {
      id: "title",
      header: t("columns.title"),
      mobile: "title",
      cell: (row) => (
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="truncate font-medium">{row.title}</span>
          <span className="font-numeric truncate text-xs font-normal text-muted-foreground">
            {row.slug}
          </span>
        </div>
      ),
    },
    {
      id: "state",
      header: t("columns.state"),
      className: "w-full",
      cell: (row) =>
        activeUpload?.lectureId === row.id ? (
          <div className="flex items-center justify-end gap-2 md:justify-start">
            <StatusBadge status="warning">{t("state.uploading")}</StatusBadge>
            {renderProgress("hidden min-w-56 md:flex")}
          </div>
        ) : (
          <VideoStateBadge hasVideo={row.videoId !== null} status={row.video} />
        ),
    },
    {
      id: "actions",
      header: <span className="sr-only">{t("columns.actions")}</span>,
      align: "end",
      mobile: "trailing",
      cell: (row) => {
        const uploadLabel = row.videoId
          ? t("actions.replace")
          : t("actions.upload");
        const canUpload = Boolean(provider) && activeUpload === null;

        return (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="outline"
              size="sm"
              className="hidden md:inline-flex"
              onClick={() => pickFile(row)}
              disabled={!canUpload}
            >
              <UploadIcon data-icon="inline-start" />
              {uploadLabel}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "size-10 md:size-8",
                    !row.videoId && "md:hidden",
                  )}
                  aria-label={t("actions.menu", { name: row.title })}
                >
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  className="md:hidden"
                  disabled={!canUpload}
                  onSelect={() => pickFile(row)}
                >
                  <UploadIcon />
                  {uploadLabel}
                </DropdownMenuItem>
                {row.videoId ? (
                  <>
                    <DropdownMenuItem
                      disabled={!provider}
                      onSelect={() => void handlePreview(row)}
                    >
                      <Eye />
                      {t("actions.preview")}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      variant="destructive"
                      disabled={activeUpload?.lectureId === row.id}
                      onSelect={() => setDeleteTarget(row)}
                    >
                      <Trash2 />
                      {t("actions.delete")}
                    </DropdownMenuItem>
                  </>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={handleFile}
      />

      {!provider && (
        <div className="flex items-start gap-3 rounded-xl border bg-background-200 px-4 py-3 text-sm">
          <CircleAlert className="mt-0.5 size-4 shrink-0 text-warning" />
          <p className="text-pretty text-muted-foreground">
            {t("notConnected")}
          </p>
        </div>
      )}

      <DataList
        items={lectures}
        getKey={(row) => row.id}
        columns={columns}
        empty={
          <EmptyState
            icon={Film}
            title={t("emptyTitle")}
            description={t("emptyDescription")}
            action={
              <Button variant="outline" asChild>
                <Link href="/admin/lectures">{t("goToLessons")}</Link>
              </Button>
            }
          />
        }
      />

      {activeUpload ? (
        <>
          {/* Keeps the last card clear of the fixed bar on mobile. */}
          <div aria-hidden className="h-24 md:hidden" />
          <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-menu backdrop-blur md:hidden">
            <p className="truncate text-sm font-medium">
              {t("uploading", { title: uploadingRow?.title ?? "" })}
            </p>
            {renderProgress("mt-1")}
          </div>
        </>
      ) : null}

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
        <DialogContent className="sm:max-w-md">
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
