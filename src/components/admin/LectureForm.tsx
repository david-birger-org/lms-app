"use client";

import { useTranslations } from "next-intl";
import type { FormEvent } from "react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { DialogClose, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { AdminLectureRecord } from "@/lib/server/lectures";

export interface LectureFormData {
  slug: string;
  title: string;
  description: string | null;
  coverImageUrl: string | null;
  sortOrder: number;
  active: boolean;
}

interface LectureFormProps {
  initialData?: AdminLectureRecord;
  onSubmit: (data: LectureFormData) => void;
  isSubmitting: boolean;
  submitLabel: string;
}

export function LectureForm({
  initialData,
  onSubmit,
  isSubmitting,
  submitLabel,
}: LectureFormProps) {
  const t = useTranslations("admin.lectures.form");
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [slug, setSlug] = useState(initialData?.slug ?? "");
  const [description, setDescription] = useState(
    initialData?.description ?? "",
  );
  const [coverImageUrl, setCoverImageUrl] = useState(
    initialData?.coverImageUrl ?? "",
  );
  const [sortOrder, setSortOrder] = useState(
    String(initialData?.sortOrder ?? 0),
  );
  const [active, setActive] = useState(initialData?.active ?? true);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onSubmit({
      slug: slug.trim(),
      title: title.trim(),
      description: description.trim() || null,
      coverImageUrl: coverImageUrl.trim() || null,
      sortOrder: Number(sortOrder) || 0,
      active,
    });
  }

  const optional = (
    <span className="font-normal text-muted-foreground">{t("optional")}</span>
  );

  return (
    <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
      <div className="flex flex-col gap-2">
        <Label htmlFor="lectureTitle">{t("title")}</Label>
        <Input
          id="lectureTitle"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_6rem] gap-4 sm:grid-cols-[minmax(0,1fr)_8rem]">
        <div className="flex min-w-0 flex-col gap-2">
          <Label htmlFor="lectureSlug">{t("slug")}</Label>
          <Input
            id="lectureSlug"
            className="font-numeric"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="lesson-1"
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            title={t("slugHint")}
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="lectureSortOrder">{t("sortOrder")}</Label>
          <Input
            id="lectureSortOrder"
            className="font-numeric"
            type="number"
            inputMode="numeric"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="lectureDescription">
          {t("description")} {optional}
        </Label>
        <Textarea
          id="lectureDescription"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="min-h-24"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="lectureCover">
          {t("coverImageUrl")} {optional}
        </Label>
        <Input
          id="lectureCover"
          value={coverImageUrl}
          onChange={(e) => setCoverImageUrl(e.target.value)}
        />
      </div>

      <label
        htmlFor="lectureActive"
        className="flex min-h-14 items-center justify-between gap-4 rounded-lg border px-3 py-2.5"
      >
        <span className="flex flex-col gap-0.5">
          <span className="text-sm font-medium">{t("active")}</span>
          <span className="text-xs text-muted-foreground">
            {t("activeHint")}
          </span>
        </span>
        <Switch
          id="lectureActive"
          checked={active}
          onCheckedChange={setActive}
        />
      </label>

      <DialogFooter className="mt-1">
        <DialogClose asChild>
          <Button type="button" variant="outline">
            {t("cancel")}
          </Button>
        </DialogClose>
        <Button type="submit" disabled={isSubmitting} className="min-w-28">
          {isSubmitting ? t("saving") : submitLabel}
        </Button>
      </DialogFooter>
    </form>
  );
}
