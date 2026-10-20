import { Suspense } from "react";

import { AdminDataTableSkeleton } from "@/components/admin/AdminDataTableShell";
import { RegistrationPaymentsTable } from "@/components/admin/RegistrationPaymentsTable";
import { DashboardPage } from "@/components/dashboard/page-shell";
import { Section } from "@/components/shell/page";
import { listAdminRegistrationPayments } from "@/lib/server/admin-registration-payments";

async function RegistrationPaymentsContent() {
  const payments = await listAdminRegistrationPayments();

  return <RegistrationPaymentsTable payments={payments} />;
}

export default function AdminRegistrationPaymentsPage() {
  return (
    <DashboardPage route="/admin/registration-payments" width="wide">
      <Section>
        <Suspense fallback={<AdminDataTableSkeleton stats={4} />}>
          <RegistrationPaymentsContent />
        </Suspense>
      </Section>
    </DashboardPage>
  );
}
