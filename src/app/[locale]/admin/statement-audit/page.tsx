import { Suspense } from "react";

import { AdminDataTableSkeleton } from "@/components/admin/AdminDataTableShell";
import { MonobankStatementProvider } from "@/components/admin/PaymentsDataProvider";
import { PaymentsHistoryTable } from "@/components/admin/PaymentsHistoryTable";
import { DashboardPage } from "@/components/dashboard/page-shell";
import { Section } from "@/components/shell/page";
import { getInitialMonobankStatementState } from "@/lib/server/monobank";

async function StatementAuditContent() {
  const statement = await getInitialMonobankStatementState();

  return (
    <MonobankStatementProvider {...statement}>
      <PaymentsHistoryTable source="provider" />
    </MonobankStatementProvider>
  );
}

export default function AdminStatementAuditPage() {
  return (
    <DashboardPage route="/admin/statement-audit" width="wide">
      <Section>
        <Suspense fallback={<AdminDataTableSkeleton stats={2} />}>
          <StatementAuditContent />
        </Suspense>
      </Section>
    </DashboardPage>
  );
}
