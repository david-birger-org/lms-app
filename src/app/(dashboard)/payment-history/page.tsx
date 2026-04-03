import { PaymentsHistoryProvider } from "@/components/admin/PaymentsDataProvider";
import { PaymentsHistoryTable } from "@/components/admin/PaymentsHistoryTable";
import {
  DashboardPage,
  DashboardSection,
} from "@/components/dashboard/page-shell";
import { getInitialPaymentsHistoryState } from "@/lib/server/payments";

export default async function PaymentHistoryPage() {
  const paymentHistory = await getInitialPaymentsHistoryState();

  return (
    <PaymentsHistoryProvider {...paymentHistory}>
      <DashboardPage route="/payment-history">
        <DashboardSection>
          <PaymentsHistoryTable source="database" />
        </DashboardSection>
      </DashboardPage>
    </PaymentsHistoryProvider>
  );
}
