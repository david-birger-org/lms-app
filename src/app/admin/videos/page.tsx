import { Suspense } from "react";

import { VideosManager } from "@/components/admin/VideosManager";
import {
  DashboardPage,
  DashboardSection,
} from "@/components/dashboard/page-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { buildVideosOverview, listAdminLectures } from "@/lib/server/lectures";

async function VideosContent() {
  const overview = await buildVideosOverview(await listAdminLectures());

  return (
    <DashboardSection>
      <VideosManager initialOverview={overview} />
    </DashboardSection>
  );
}

export default function AdminVideosPage() {
  return (
    <DashboardPage route="/admin/videos">
      <Suspense
        fallback={
          <DashboardSection>
            <Skeleton className="h-[400px] w-full rounded-xl" />
          </DashboardSection>
        }
      >
        <VideosContent />
      </Suspense>
    </DashboardPage>
  );
}
