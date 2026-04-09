import { BookOpen } from "lucide-react";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import {
  CabinetPage,
  CabinetSection,
} from "@/components/cabinet/cabinet-page-shell";
import { LectureCard } from "@/components/cabinet/lecture-card";
import { Skeleton } from "@/components/ui/skeleton";
import { getActiveFeatures } from "@/lib/server/user-features";
import { listUserLectures } from "@/lib/server/user-lectures";

async function LecturesContent() {
  const features = await getActiveFeatures();
  if (!features.has("lectures")) notFound();

  const t = await getTranslations("lectures");
  const lectures = await listUserLectures();

  if (lectures.length === 0)
    return (
      <CabinetSection>
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <BookOpen className="size-10 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">{t("empty")}</p>
        </div>
      </CabinetSection>
    );

  return (
    <CabinetSection>
      <div className="grid gap-3">
        {lectures.map((lecture) => (
          <LectureCard key={lecture.slug} lecture={lecture} />
        ))}
      </div>
    </CabinetSection>
  );
}

export default function DashboardLecturesPage() {
  return (
    <CabinetPage route="/dashboard/lectures">
      <Suspense
        fallback={
          <CabinetSection>
            <Skeleton className="h-[300px] w-full rounded-xl" />
          </CabinetSection>
        }
      >
        <LecturesContent />
      </Suspense>
    </CabinetPage>
  );
}
