"use client";

import {
  BookOpen,
  Eye,
  EyeOff,
  FileX,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  Upload as UploadIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { type ChangeEvent, useRef, useState } from "react";
import { toast } from "sonner";

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
import type { AdminLectureRecord } from "@/lib/server/lectures";
import type { VideoStatus } from "@/lib/server/video/types";

import { LectureForm, type LectureFormData } from "./LectureForm";
import { requestJson } from "./request-json";
import { VideoStateBadge } from "./VideoStateBadge";

type Lecture = AdminLectureRecord;

// Vercel caps function request bodies at 4.5 MB, and notes go through the
// Next proxy.
const MAX_NOTES_BYTES = 4_500_000;

interface PendingConfirm {
  title: string;
  description: string;
  action: () => Promise<void>;
}

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function toFormData(lecture: Lecture): LectureFormData {
  return {
    slug: lecture.slug,
    title: lecture.title,
    description: lecture.description,
    coverImageUrl: lecture.coverImageUrl,
    sortOrder: lecture.sortOrder,
    active: lecture.active,
  };
}

export function LecturesManager({
  initialLectures,
  videoStatuses,
}: {
  initialLectures: Lecture[];
  videoStatuses: Record<string, VideoStatus | null>;
}) {
  const t = useTranslations("admin.lectures");
  const [lectures, setLectures] = useState<Lecture[]>(initialLectures);
  const [editing, setEditing] = useState<Lecture | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirm, setConfirm] = useState<PendingConfirm | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [notesBusyId, setNotesBusyId] = useState<string | null>(null);
  const notesInputRef = useRef<HTMLInputElement>(null);
  const fileTargetRef = useRef<Lecture | null>(null);

  const sorted = [...lectures].sort((a, b) => a.sortOrder - b.sortOrder);

  function replaceLecture(next: Lecture) {
    setLectures((current) =>
      current.map((item) => (item.id === next.id ? next : item)),
    );
  }

  async function handleSave(data: LectureFormData) {
    setIsSubmitting(true);
    try {
      const url = editing
        ? `/api/admin/lectures?id=${editing.id}`
        : "/api/admin/lectures";
      const result = await requestJson<{ lecture: Lecture }>(url, {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (editing) {
        replaceLecture(result.lecture);
        setEditing(null);
        toast.success(t("success.updated"));
      } else {
        setLectures((current) => [...current, result.lecture]);
        setIsCreateOpen(false);
        toast.success(t("success.created"));
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("errors.generic"));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleToggleActive(lecture: Lecture) {
    try {
      const result = await requestJson<{ lecture: Lecture }>(
        `/api/admin/lectures?id=${lecture.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...toFormData(lecture),
            active: !lecture.active,
          }),
        },
      );
      replaceLecture(result.lecture);
      toast.success(
        lecture.active ? t("success.hidden") : t("success.visible"),
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("errors.generic"));
    }
  }

  async function runConfirm() {
    if (!confirm) return;
    setIsConfirming(true);
    try {
      await confirm.action();
      setConfirm(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("errors.generic"));
    } finally {
      setIsConfirming(false);
    }
  }

  function askDeleteLecture(lecture: Lecture) {
    setConfirm({
      title: t("dialogs.deleteLecture.title"),
      description: t("dialogs.deleteLecture.description", {
        name: lecture.title,
      }),
      action: async () => {
        await requestJson(`/api/admin/lectures?id=${lecture.id}`, {
          method: "DELETE",
        });
        setLectures((current) => current.filter((l) => l.id !== lecture.id));
        toast.success(t("success.deleted"));
      },
    });
  }

  function askRemoveNotes(lecture: Lecture) {
    setConfirm({
      title: t("dialogs.removeNotes.title"),
      description: t("dialogs.removeNotes.description", {
        name: lecture.title,
      }),
      action: async () => {
        const result = await requestJson<{ lecture: Lecture }>(
          `/api/admin/lectures/notes?id=${lecture.id}`,
          { method: "DELETE" },
        );
        replaceLecture(result.lecture);
        toast.success(t("success.notesRemoved"));
      },
    });
  }

  function pickFile(lecture: Lecture, input: HTMLInputElement | null) {
    fileTargetRef.current = lecture;
    input?.click();
  }

  async function handleNotesFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    const lecture = fileTargetRef.current;
    event.target.value = "";
    if (!file || !lecture) return;

    if (file.type !== "application/pdf") {
      toast.error(t("notes.notPdf"));
      return;
    }
    if (file.size > MAX_NOTES_BYTES) {
      toast.error(t("notes.tooLarge", { size: formatSize(file.size) }));
      return;
    }

    setNotesBusyId(lecture.id);
    try {
      const result = await requestJson<{ lecture: Lecture }>(
        `/api/admin/lectures/notes?id=${lecture.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/pdf" },
          body: file,
        },
      );
      replaceLecture(result.lecture);
      toast.success(t("success.notesUploaded"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("errors.generic"));
    } finally {
      setNotesBusyId(null);
    }
  }

  function renderNotes(lecture: Lecture) {
    if (notesBusyId === lecture.id)
      return <StatusBadge status="warning">{t("notes.uploading")}</StatusBadge>;
    if (!lecture.hasNotes)
      return <StatusBadge status="neutral">{t("notes.none")}</StatusBadge>;
    return (
      <StatusBadge status="success">
        <span className="font-numeric">
          PDF · {formatSize(lecture.notesSize)}
        </span>
      </StatusBadge>
    );
  }

  const columns: DataListColumn<Lecture>[] = [
    {
      id: "order",
      header: t("columns.order"),
      mobile: "hidden",
      className: "w-16",
      cell: (lecture) => (
        <span className="font-numeric text-muted-foreground">
          {lecture.sortOrder}
        </span>
      ),
    },
    {
      id: "title",
      header: t("columns.title"),
      mobile: "title",
      cell: (lecture) => (
        <div className="flex min-w-0 items-baseline gap-2">
          <span className="font-numeric text-muted-foreground md:hidden">
            {lecture.sortOrder}
          </span>
          <span className="truncate font-medium">{lecture.title}</span>
        </div>
      ),
    },
    {
      id: "slug",
      header: t("columns.slug"),
      cell: (lecture) => (
        <span className="font-numeric text-xs text-muted-foreground">
          {lecture.slug}
        </span>
      ),
    },
    {
      id: "status",
      header: t("columns.status"),
      mobile: "trailing",
      cell: (lecture) => (
        <StatusBadge status={lecture.active ? "success" : "neutral"}>
          {lecture.active ? t("status.active") : t("status.hidden")}
        </StatusBadge>
      ),
    },
    {
      id: "notes",
      header: t("columns.notes"),
      cell: renderNotes,
    },
    {
      id: "video",
      header: t("columns.video"),
      cell: (lecture) => (
        <Link
          href="/admin/videos"
          className="inline-flex rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <VideoStateBadge
            hasVideo={lecture.videoId !== null}
            status={videoStatuses[lecture.id] ?? null}
          />
        </Link>
      ),
    },
    {
      id: "actions",
      header: <span className="sr-only">{t("columns.actions")}</span>,
      align: "end",
      mobile: "trailing",
      className: "w-12",
      cell: (lecture) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-10 md:size-8"
              aria-label={t("actions.menu", { name: lecture.title })}
            >
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem onSelect={() => setEditing(lecture)}>
              <Pencil />
              {t("dialogs.edit.title")}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => void handleToggleActive(lecture)}>
              {lecture.active ? <EyeOff /> : <Eye />}
              {lecture.active ? t("actions.hide") : t("actions.show")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              disabled={notesBusyId !== null}
              onSelect={() => pickFile(lecture, notesInputRef.current)}
            >
              <UploadIcon />
              {lecture.hasNotes ? t("notes.replace") : t("notes.upload")}
            </DropdownMenuItem>
            {lecture.hasNotes ? (
              <DropdownMenuItem
                disabled={notesBusyId === lecture.id}
                onSelect={() => askRemoveNotes(lecture)}
              >
                <FileX />
                {t("notes.remove")}
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onSelect={() => askDeleteLecture(lecture)}
            >
              <Trash2 />
              {t("dialogs.deleteLecture.title")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const addButton = (
    <Button onClick={() => setIsCreateOpen(true)}>
      <Plus data-icon="inline-start" />
      {t("addLecture")}
    </Button>
  );

  return (
    <>
      <input
        ref={notesInputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={handleNotesFile}
      />

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {t("count", { count: lectures.length })}
        </p>
        {addButton}
      </div>

      <DataList
        items={sorted}
        getKey={(lecture) => lecture.id}
        columns={columns}
        empty={
          <EmptyState
            icon={BookOpen}
            title={t("emptyTitle")}
            description={t("emptyDescription")}
            action={addButton}
          />
        }
      />

      <Dialog
        open={isCreateOpen || editing !== null}
        onOpenChange={(open) => {
          if (open) return;
          setIsCreateOpen(false);
          setEditing(null);
        }}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {editing ? t("dialogs.edit.title") : t("dialogs.create.title")}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? t("dialogs.edit.description")
                : t("dialogs.create.description")}
            </DialogDescription>
          </DialogHeader>
          <LectureForm
            key={editing?.id ?? "new"}
            initialData={editing ?? undefined}
            onSubmit={handleSave}
            isSubmitting={isSubmitting}
            submitLabel={
              editing ? t("dialogs.edit.submit") : t("dialogs.create.submit")
            }
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={confirm !== null}
        onOpenChange={(open) => {
          if (!open && !isConfirming) setConfirm(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{confirm?.title}</DialogTitle>
            <DialogDescription>{confirm?.description}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirm(null)}
              disabled={isConfirming}
            >
              {t("dialogs.confirm.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={runConfirm}
              disabled={isConfirming}
            >
              {isConfirming
                ? t("dialogs.confirm.working")
                : t("dialogs.confirm.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
