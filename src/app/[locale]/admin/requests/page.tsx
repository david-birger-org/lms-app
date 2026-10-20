import { Suspense } from "react";

import { AdminListSkeleton } from "@/components/admin/admin-list-skeleton";
import { ContactRequestsManager } from "@/components/admin/ContactRequestsManager";
import { DashboardPage } from "@/components/dashboard/page-shell";
import { Section } from "@/components/shell/page";
import { listAdminContactRequests } from "@/lib/server/admin-contact-requests";

async function RequestsContent() {
  const requests = await listAdminContactRequests();

  return (
    <Section>
      <ContactRequestsManager initialRequests={requests} />
    </Section>
  );
}

export default function AdminRequestsPage() {
  return (
    <DashboardPage route="/admin/requests" width="wide">
      <Suspense fallback={<AdminListSkeleton />}>
        <RequestsContent />
      </Suspense>
    </DashboardPage>
  );
}
