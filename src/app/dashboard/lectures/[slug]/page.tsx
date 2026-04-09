import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { CabinetSection } from "@/components/cabinet/cabinet-page-shell";
import { LazyLectureReader } from "@/components/cabinet/lazy-lecture-reader";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/i18n/routing";
import { requireAuthPageAccess } from "@/lib/auth/auth-server";
import { getActiveFeatures } from "@/lib/server/user-features";
import { getUserLecture } from "@/lib/server/user-lectures";

async function LectureContent({ slug }: { slug: string }) {
  const [features, access, t] = await Promise.all([
    getActiveFeatures(),
    requireAuthPageAccess(),
    getTranslations("lectures"),
  ]);

  if (!features.has("lectures")) notFound();

  const lecture = await getUserLecture(slug);
  if (!lecture) notFound();

  const watermarkText = "David Birger";

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
      <div className="rounded-xl border bg-card shadow-xs">
        <h1 className="mb-6 px-4 pt-4 text-xl font-semibold tracking-tight sm:text-2xl md:px-8 md:pt-8">
          {lecture.title}
        </h1>
        <Suspense
          fallback={
            <Skeleton className="h-[600px] w-full rounded-xl" />
          }
        >
          <div className="md:px-8 md:pb-8">
            <LazyLectureReader
              pdfBase64={lecture.pdfBase64}
              watermarkText={watermarkText}
            />
          </div>
        </Suspense>
      </div>
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
    <div className="@container/main mx-auto flex w-full max-w-[1200px] flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <Suspense
        fallback={
          <CabinetSection>
            <Skeleton className="h-[500px] w-full rounded-xl" />
          </CabinetSection>
        }
      >
        <LectureContent slug={slug} />
      </Suspense>
    </div>
  );
}
