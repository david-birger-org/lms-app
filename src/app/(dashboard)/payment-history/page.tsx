import { MonobankPaymentsHistory } from "@/components/admin/MonobankPaymentsHistory";
import { MonobankStatementProvider } from "@/components/admin/MonobankStatementProvider";
import {
  DashboardPage,
  DashboardSection,
} from "@/components/dashboard/page-shell";
import { getInitialMonobankStatementState } from "@/lib/server/monobank";

export default async function PaymentHistoryPage() {
  const statement = await getInitialMonobankStatementState();

  return (
    <MonobankStatementProvider {...statement}>
      <DashboardPage route="/payment-history">
        <DashboardSection>
          <MonobankPaymentsHistory />
        </DashboardSection>
      </DashboardPage>
    </MonobankStatementProvider>
  );
}
