import { Suspense } from "react";

import { LecturesManager } from "@/components/admin/LecturesManager";
import {
  DashboardPage,
  DashboardSection,
} from "@/components/dashboard/page-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { buildVideosOverview, listAdminLectures } from "@/lib/server/lectures";

async function LecturesContent() {
  const lectures = await listAdminLectures();
  const overview = await buildVideosOverview(lectures);
  const videoStatuses = Object.fromEntries(
    overview.lectures.map((row) => [row.id, row.video]),
  );

  return (
    <DashboardSection>
      <LecturesManager
        initialLectures={lectures}
        videoStatuses={videoStatuses}
      />
    </DashboardSection>
  );
}

export default function AdminLecturesPage() {
  return (
    <DashboardPage route="/admin/lectures">
      <Suspense
        fallback={
          <DashboardSection>
            <Skeleton className="h-[400px] w-full rounded-xl" />
          </DashboardSection>
        }
      >
        <LecturesContent />
      </Suspense>
    </DashboardPage>
  );
}
