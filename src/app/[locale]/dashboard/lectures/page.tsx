import { BookOpen } from "lucide-react";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { CabinetPage } from "@/components/cabinet/cabinet-page-shell";
import { LectureCard } from "@/components/cabinet/lecture-card";
import { EmptyState } from "@/components/shell/empty-state";
import { Section } from "@/components/shell/page";
import { Skeleton } from "@/components/ui/skeleton";
import { getActiveFeatures } from "@/lib/server/user-features";
import { listUserLectures } from "@/lib/server/user-lectures";

const GRID = "grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4 lg:grid-cols-3";

async function LecturesContent() {
  const features = await getActiveFeatures();
  if (!features.has("lectures")) notFound();

  const t = await getTranslations("lectures");
  const lectures = await listUserLectures();

  return (
    <Section>
      {lectures.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title={t("empty")}
          description={t("emptyDescription")}
        />
      ) : (
        <ul className={GRID}>
          {lectures.map((lecture, index) => (
            <li key={lecture.slug}>
              <LectureCard lecture={lecture} number={index + 1} />
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

const SKELETON_CARDS = ["a", "b", "c", "d", "e", "f"];

function LecturesSkeleton() {
  return (
    <Section>
      <div className={GRID}>
        {SKELETON_CARDS.map((key) => (
          <div
            key={key}
            className="flex flex-col gap-4 rounded-xl border bg-card p-4 shadow-card"
          >
            <Skeleton className="size-10 rounded-lg" />
            <div className="flex flex-col gap-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-full" />
            </div>
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
      </div>
    </Section>
  );
}

export default function DashboardLecturesPage() {
  return (
    <CabinetPage route="/dashboard/lectures">
      <Suspense fallback={<LecturesSkeleton />}>
        <LecturesContent />
      </Suspense>
    </CabinetPage>
  );
}
