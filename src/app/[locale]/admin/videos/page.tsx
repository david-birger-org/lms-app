import { Suspense } from "react";

import { AdminListSkeleton } from "@/components/admin/admin-list-skeleton";
import { VideosManager } from "@/components/admin/VideosManager";
import { DashboardPage } from "@/components/dashboard/page-shell";
import { Section } from "@/components/shell/page";
import { buildVideosOverview, listAdminLectures } from "@/lib/server/lectures";

async function VideosContent() {
  const overview = await buildVideosOverview(await listAdminLectures());

  return (
    <Section>
      <VideosManager initialOverview={overview} />
    </Section>
  );
}

export default function AdminVideosPage() {
  return (
    <DashboardPage route="/admin/videos">
      <Suspense fallback={<AdminListSkeleton toolbar={false} />}>
        <VideosContent />
      </Suspense>
    </DashboardPage>
  );
}
