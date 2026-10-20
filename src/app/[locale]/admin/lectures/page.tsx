import { Suspense } from "react";

import { AdminListSkeleton } from "@/components/admin/admin-list-skeleton";
import { LecturesManager } from "@/components/admin/LecturesManager";
import { DashboardPage } from "@/components/dashboard/page-shell";
import { Section } from "@/components/shell/page";
import { buildVideosOverview, listAdminLectures } from "@/lib/server/lectures";

async function LecturesContent() {
  const lectures = await listAdminLectures();
  const overview = await buildVideosOverview(lectures);
  const videoStatuses = Object.fromEntries(
    overview.lectures.map((row) => [row.id, row.video]),
  );

  return (
    <Section>
      <LecturesManager
        initialLectures={lectures}
        videoStatuses={videoStatuses}
      />
    </Section>
  );
}

export default function AdminLecturesPage() {
  return (
    <DashboardPage route="/admin/lectures">
      <Suspense fallback={<AdminListSkeleton />}>
        <LecturesContent />
      </Suspense>
    </DashboardPage>
  );
}
