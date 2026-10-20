import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { CabinetSection } from "@/components/cabinet/cabinet-page-shell";
import { LecturePreview } from "@/components/cabinet/lecture-preview";
import { LessonVideoPlayer } from "@/components/cabinet/lesson-video-player";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/i18n/routing";
import { requireAuthPageAccess } from "@/lib/auth/auth-server";
import { getLectureMeta } from "@/lib/server/lecture-renderer";
import { getActiveFeatures } from "@/lib/server/user-features";
import {
  getUserLecture,
  getUserLectureVideo,
} from "@/lib/server/user-lectures";

async function LectureContent({ slug }: { slug: string }) {
  const [features, access, t] = await Promise.all([
    getActiveFeatures(),
    requireAuthPageAccess(),
    getTranslations("lectures"),
  ]);

  if (!features.has("lectures")) notFound();

  const lecture = await getUserLecture(slug);
  if (!lecture) notFound();

  const [video, meta] = await Promise.all([
    lecture.hasVideo ? getUserLectureVideo(slug) : null,
    lecture.hasNotes ? getLectureMeta(slug, access.authenticatedUser) : null,
  ]);

  return (
    <CabinetSection>
      <div className="mb-4">
        <Link
          href="/dashboard/lectures"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          {t("backToList")}
        </Link>
      </div>
      <Card size="sm">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">{lecture.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {video && (
            <LessonVideoPlayer
              playback={video}
              title={lecture.title}
              watermark={access.authenticatedUser.email}
            />
          )}
          {meta && (
            <LecturePreview
              slug={slug}
              pageCount={meta.pageCount}
              pageWidth={meta.pageWidth}
              pageHeight={meta.pageHeight}
              watermarkText="David Birger"
            />
          )}
          {!video && !meta && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {t("comingSoon")}
            </p>
          )}
        </CardContent>
      </Card>
    </CabinetSection>
  );
}

export default async function LectureDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <div className="@container/main mx-auto flex w-full max-w-[900px] flex-1 flex-col gap-4 px-3 py-4 sm:px-4 md:gap-6 md:py-6">
      <Suspense
        fallback={
          <CabinetSection>
            <Skeleton className="h-[500px] w-full rounded-4xl" />
          </CabinetSection>
        }
      >
        <LectureContent slug={slug} />
      </Suspense>
    </div>
  );
}
