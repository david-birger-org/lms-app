import { ArrowUpRight, BookOpen, FileText, Video } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/routing";
import type { LectureSummary } from "@/lib/server/user-lectures";

export function LectureCard({
  lecture,
  number,
}: {
  lecture: LectureSummary;
  number: number;
}) {
  const t = useTranslations("lectures");

  return (
    <Link
      href={`/dashboard/lectures/${lecture.slug}`}
      className="group flex h-full flex-col gap-4 rounded-xl border bg-card p-4 shadow-card transition-colors duration-150 outline-none hover:bg-background-200 focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <div className="flex items-start justify-between gap-3">
        {lecture.coverImageUrl ? (
          <Image
            src={lecture.coverImageUrl}
            alt=""
            width={40}
            height={40}
            className="size-10 rounded-lg object-cover outline -outline-offset-1 outline-foreground/10"
          />
        ) : (
          <div className="flex size-10 items-center justify-center rounded-lg border bg-background-200 text-muted-foreground">
            <BookOpen className="size-4.5" strokeWidth={1.75} />
          </div>
        )}
        <ArrowUpRight
          aria-hidden
          className="size-4 text-muted-foreground transition-colors duration-150 group-hover:text-foreground"
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="font-numeric text-xs text-muted-foreground">
          {t("lessonNumber", { number: String(number).padStart(2, "0") })}
        </p>
        <p className="font-medium text-pretty">{lecture.title}</p>
        {lecture.description ? (
          <p className="line-clamp-2 text-sm text-pretty text-muted-foreground">
            {lecture.description}
          </p>
        ) : null}
      </div>
      {lecture.hasVideo || lecture.hasNotes ? (
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          {lecture.hasVideo ? (
            <span className="inline-flex items-center gap-1.5">
              <Video aria-hidden className="size-3.5" />
              {t("video")}
            </span>
          ) : null}
          {lecture.hasNotes ? (
            <span className="inline-flex items-center gap-1.5">
              <FileText aria-hidden className="size-3.5" />
              {t("notes")}
            </span>
          ) : null}
        </div>
      ) : null}
    </Link>
  );
}
