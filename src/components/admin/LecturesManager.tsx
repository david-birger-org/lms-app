"use client";

import { Pencil, Plus, Trash2, Upload as UploadIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { type ChangeEvent, useRef, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
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

  function renderNotesCell(lecture: Lecture) {
    const busy = notesBusyId === lecture.id;
    return (
      <div className="flex items-center gap-1">
        <span className="text-sm text-muted-foreground">
          {busy
            ? t("notes.uploading")
            : lecture.hasNotes
              ? formatSize(lecture.notesSize)
              : t("notes.none")}
        </span>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => pickFile(lecture, notesInputRef.current)}
          disabled={notesBusyId !== null}
          aria-label={lecture.hasNotes ? t("notes.replace") : t("notes.upload")}
          title={lecture.hasNotes ? t("notes.replace") : t("notes.upload")}
        >
          <UploadIcon className="size-3.5" />
        </Button>
        {lecture.hasNotes && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => askRemoveNotes(lecture)}
            disabled={busy}
            aria-label={t("notes.remove")}
            title={t("notes.remove")}
          >
            <Trash2 className="size-3.5 text-destructive" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <>
      <input
        ref={notesInputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={handleNotesFile}
      />

      <Card className="shadow-xs">
        <CardHeader className="border-b px-3 sm:px-6">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t("title")}</CardTitle>
              <CardDescription>{t("description")}</CardDescription>
            </div>
            <Button className="h-9 gap-2" onClick={() => setIsCreateOpen(true)}>
              <Plus className="size-4" />
              {t("addLecture")}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {sorted.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              {t("empty")}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-3 text-center sm:pl-6">
                    {t("columns.order")}
                  </TableHead>
                  <TableHead>{t("columns.title")}</TableHead>
                  <TableHead>{t("columns.slug")}</TableHead>
                  <TableHead className="text-center">
                    {t("columns.status")}
                  </TableHead>
                  <TableHead>{t("columns.notes")}</TableHead>
                  <TableHead>{t("columns.video")}</TableHead>
                  <TableHead className="pr-3 text-right sm:pr-6">
                    {t("columns.actions")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((lecture) => (
                  <TableRow key={lecture.id}>
                    <TableCell className="pl-3 text-center text-sm text-muted-foreground sm:pl-6">
                      {lecture.sortOrder}
                    </TableCell>
                    <TableCell className="font-medium">
                      {lecture.title}
                    </TableCell>
                    <TableCell>
                      <code className="text-xs">{lecture.slug}</code>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={lecture.active ? "default" : "secondary"}
                        className="cursor-pointer"
                        onClick={() => handleToggleActive(lecture)}
                      >
                        {lecture.active
                          ? t("status.active")
                          : t("status.hidden")}
                      </Badge>
                    </TableCell>
                    <TableCell>{renderNotesCell(lecture)}</TableCell>
                    <TableCell>
                      <Link href="/admin/videos">
                        <VideoStateBadge
                          hasVideo={lecture.videoId !== null}
                          status={videoStatuses[lecture.id] ?? null}
                        />
                      </Link>
                    </TableCell>
                    <TableCell className="pr-3 text-right sm:pr-6">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setEditing(lecture)}
                          aria-label={t("dialogs.edit.title")}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => askDeleteLecture(lecture)}
                          aria-label={t("dialogs.deleteLecture.title")}
                        >
                          <Trash2 className="size-3.5 text-destructive" />
                        </Button>
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
        <DialogContent className="sm:max-w-sm">
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
