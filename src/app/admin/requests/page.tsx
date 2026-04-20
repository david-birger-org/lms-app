import { Suspense } from "react";

import { ContactRequestsManager } from "@/components/admin/ContactRequestsManager";
import {
  DashboardPage,
  DashboardSection,
} from "@/components/dashboard/page-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { listAdminContactRequests } from "@/lib/server/admin-contact-requests";

async function RequestsContent() {
  const requests = await listAdminContactRequests();

  return (
    <DashboardSection>
      <ContactRequestsManager initialRequests={requests} />
    </DashboardSection>
  );
}

export default function AdminRequestsPage() {
  return (
    <DashboardPage route="/admin/requests" width="wide">
      <Suspense
        fallback={
          <DashboardSection>
            <Skeleton className="h-[400px] w-full rounded-xl" />
          </DashboardSection>
        }
      >
        <RequestsContent />
      </Suspense>
    </DashboardPage>
  );
}
