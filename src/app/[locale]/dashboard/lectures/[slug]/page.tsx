import { ArrowLeft, ArrowRight, Clock } from "lucide-react";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { LecturePreview } from "@/components/cabinet/lecture-preview";
import { LessonVideoPlayer } from "@/components/cabinet/lesson-video-player";
import { EmptyState } from "@/components/shell/empty-state";
import { Section } from "@/components/shell/page";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/i18n/routing";
import { requireAuthPageAccess } from "@/lib/auth/auth-server";
import { getLectureMeta } from "@/lib/server/lecture-renderer";
import { getActiveFeatures } from "@/lib/server/user-features";
import {
  getUserLectureVideo,
  type LectureSummary,
  listUserLectures,
} from "@/lib/server/user-lectures";

// Mobile: video edge to edge under a sticky title bar. md+: a centered column.
const COLUMN =
  "stagger mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 pb-8 md:gap-8 md:px-6 md:py-8";

function LessonLink({
  direction,
  label,
  lecture,
}: {
  direction: "previous" | "next";
  label: string;
  lecture: LectureSummary;
}) {
  const next = direction === "next";
  const Icon = next ? ArrowRight : ArrowLeft;

  return (
    <Link
      href={`/dashboard/lectures/${lecture.slug}`}
      className={
        next
          ? "group col-start-2 flex min-h-16 min-w-0 flex-col items-end justify-center gap-1 rounded-xl border bg-card p-3 text-right shadow-card transition-colors duration-150 outline-none hover:bg-background-200 focus-visible:ring-3 focus-visible:ring-ring/50 md:p-4"
          : "group col-start-1 flex min-h-16 min-w-0 flex-col items-start justify-center gap-1 rounded-xl border bg-card p-3 shadow-card transition-colors duration-150 outline-none hover:bg-background-200 focus-visible:ring-3 focus-visible:ring-ring/50 md:p-4"
      }
    >
      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        {next ? null : <Icon aria-hidden className="size-3.5" />}
        {label}
        {next ? <Icon aria-hidden className="size-3.5" /> : null}
      </span>
      <span className="w-full truncate text-sm font-medium">
        {lecture.title}
      </span>
    </Link>
  );
}

async function LectureContent({ slug }: { slug: string }) {
  const [features, access, t] = await Promise.all([
    getActiveFeatures(),
    requireAuthPageAccess(),
    getTranslations("lectures"),
  ]);

  if (!features.has("lectures")) notFound();

  // One list read gives the lecture and its previous and next neighbours.
  const lectures = await listUserLectures();
  const index = lectures.findIndex((l) => l.slug === slug);
  const lecture = lectures[index];
  if (!lecture) notFound();

  const previous = lectures[index - 1];
  const next = lectures[index + 1];

  const [video, meta] = await Promise.all([
    lecture.hasVideo ? getUserLectureVideo(slug) : null,
    lecture.hasNotes ? getLectureMeta(slug, access.authenticatedUser) : null,
  ]);

  const position = t("position", {
    current: index + 1,
    total: lectures.length,
  });

  return (
    <div className={COLUMN}>
      <div className="sticky top-(--header-height) z-30 flex h-12 items-center gap-1 border-b bg-background/80 pr-4 pl-1 backdrop-blur-md md:hidden">
        <Button variant="ghost" size="icon-lg" asChild>
          <Link href="/dashboard/lectures" aria-label={t("backToList")}>
            <ArrowLeft />
          </Link>
        </Button>
        <h1 className="min-w-0 flex-1 truncate text-sm font-semibold">
          {lecture.title}
        </h1>
        <span className="shrink-0 font-numeric text-xs text-muted-foreground">
          {position}
        </span>
      </div>

      <header className="hidden flex-col gap-3 md:flex">
        <Button variant="ghost" size="sm" className="-ml-2.5 w-fit" asChild>
          <Link href="/dashboard/lectures">
            <ArrowLeft data-icon="inline-start" />
            {t("backToList")}
          </Link>
        </Button>
        <div className="flex flex-col gap-1.5">
          <p className="font-numeric text-xs text-muted-foreground">
            {t("lessonNumber", {
              number: String(index + 1).padStart(2, "0"),
            })}{" "}
            · {position}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-balance md:text-[2rem] md:leading-10">
            {lecture.title}
          </h1>
          {lecture.description ? (
            <p className="max-w-2xl text-base text-pretty text-muted-foreground">
              {lecture.description}
            </p>
          ) : null}
        </div>
      </header>

      {video ? (
        <LessonVideoPlayer
          className="-mt-6 rounded-none md:mt-0 md:rounded-xl md:shadow-card"
          playback={video}
          title={lecture.title}
          watermark={access.authenticatedUser.email}
        />
      ) : null}

      {lecture.description ? (
        <p className="px-4 text-sm text-pretty text-muted-foreground md:hidden">
          {lecture.description}
        </p>
      ) : null}

      {meta ? (
        <Section
          className="px-4 md:px-0"
          title={t("notes")}
          description={
            <span className="font-numeric">
              {t("notesPages", { count: meta.pageCount })}
            </span>
          }
        >
          <LecturePreview
            slug={slug}
            pageCount={meta.pageCount}
            pageWidth={meta.pageWidth}
            pageHeight={meta.pageHeight}
            watermarkText="David Birger"
          />
        </Section>
      ) : null}

      {!video && !meta ? (
        <div className="px-4 md:px-0">
          <EmptyState icon={Clock} title={t("comingSoon")} />
        </div>
      ) : null}

      {previous || next ? (
        <nav
          aria-label={t("title")}
          className="grid grid-cols-2 gap-3 px-4 md:px-0"
        >
          {previous ? (
            <LessonLink
              direction="previous"
              label={t("previous")}
              lecture={previous}
            />
          ) : null}
          {next ? (
            <LessonLink direction="next" label={t("next")} lecture={next} />
          ) : null}
        </nav>
      ) : null}
    </div>
  );
}

function LectureSkeleton() {
  return (
    <div className={COLUMN}>
      <div className="flex h-12 items-center gap-3 border-b px-4 md:hidden">
        <Skeleton className="size-6 rounded-lg" />
        <Skeleton className="h-4 flex-1" />
      </div>
      <div className="hidden flex-col gap-3 md:flex">
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-9 w-2/3" />
      </div>
      <Skeleton className="-mt-6 aspect-video w-full rounded-none md:mt-0 md:rounded-xl" />
      <div className="flex flex-col gap-4 px-4 md:px-0">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="aspect-[1/1.414] w-full rounded-lg" />
      </div>
    </div>
  );
}

export default async function LectureDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <Suspense fallback={<LectureSkeleton />}>
      <LectureContent slug={slug} />
    </Suspense>
  );
}
