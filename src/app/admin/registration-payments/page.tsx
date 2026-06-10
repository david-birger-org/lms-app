import { Suspense } from "react";

import { RegistrationPaymentsTable } from "@/components/admin/RegistrationPaymentsTable";
import {
  DashboardPage,
  DashboardSection,
} from "@/components/dashboard/page-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { listAdminRegistrationPayments } from "@/lib/server/admin-registration-payments";

async function RegistrationPaymentsContent() {
  const payments = await listAdminRegistrationPayments();

  return (
    <DashboardSection>
      <RegistrationPaymentsTable payments={payments} />
    </DashboardSection>
  );
}

export default function AdminRegistrationPaymentsPage() {
  return (
    <DashboardPage route="/admin/registration-payments" width="wide">
      <Suspense
        fallback={
          <DashboardSection>
            <Skeleton className="h-[400px] w-full rounded-xl" />
          </DashboardSection>
        }
      >
        <RegistrationPaymentsContent />
      </Suspense>
    </DashboardPage>
  );
}
