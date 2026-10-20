"use client";

import { useTranslations } from "next-intl";
import type { FormEvent } from "react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
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

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label htmlFor="lectureTitle">{t("title")}</Label>
        <Input
          className="h-9"
          id="lectureTitle"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
        <div className="space-y-2">
          <Label htmlFor="lectureSlug">{t("slug")}</Label>
          <Input
            className="h-9"
            id="lectureSlug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="lesson-1"
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            title={t("slugHint")}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lectureSortOrder">{t("sortOrder")}</Label>
          <Input
            className="h-9"
            id="lectureSortOrder"
            type="number"
            inputMode="numeric"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="lectureDescription">
          {t("description")}{" "}
          <span className="font-normal text-muted-foreground">
            {t("optional")}
          </span>
        </Label>
        <Textarea
          id="lectureDescription"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="min-h-24"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="lectureCover">
          {t("coverImageUrl")}{" "}
          <span className="font-normal text-muted-foreground">
            {t("optional")}
          </span>
        </Label>
        <Input
          className="h-9"
          id="lectureCover"
          value={coverImageUrl}
          onChange={(e) => setCoverImageUrl(e.target.value)}
        />
      </div>

      <div className="flex items-center justify-between rounded-lg border px-3 py-2">
        <div className="space-y-0.5">
          <Label htmlFor="lectureActive">{t("active")}</Label>
          <p className="text-xs text-muted-foreground">{t("activeHint")}</p>
        </div>
        <Switch
          id="lectureActive"
          checked={active}
          onCheckedChange={setActive}
        />
      </div>

      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={isSubmitting} className="h-9 min-w-28">
          {isSubmitting ? t("saving") : submitLabel}
        </Button>
      </div>
    </form>
  );
}
