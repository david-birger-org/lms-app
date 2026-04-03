import { MonobankStatementProvider } from "@/components/admin/PaymentsDataProvider";
import { PaymentsHistoryTable } from "@/components/admin/PaymentsHistoryTable";
import {
  DashboardPage,
  DashboardSection,
} from "@/components/dashboard/page-shell";
import { getInitialMonobankStatementState } from "@/lib/server/monobank";

export default async function StatementAuditPage() {
  const statement = await getInitialMonobankStatementState();

  return (
    <MonobankStatementProvider {...statement}>
      <DashboardPage route="/statement-audit">
        <DashboardSection>
          <PaymentsHistoryTable source="provider" />
        </DashboardSection>
      </DashboardPage>
    </MonobankStatementProvider>
  );
}
