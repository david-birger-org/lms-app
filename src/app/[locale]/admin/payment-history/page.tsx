import { Suspense } from "react";

import { AdminDataTableSkeleton } from "@/components/admin/AdminDataTableShell";
import { PaymentsHistoryProvider } from "@/components/admin/PaymentsDataProvider";
import { PaymentsHistoryTable } from "@/components/admin/PaymentsHistoryTable";
import { DashboardPage } from "@/components/dashboard/page-shell";
import { Section } from "@/components/shell/page";
import { getInitialPaymentsHistoryState } from "@/lib/server/payments";

async function PaymentsHistoryContent() {
  const paymentHistory = await getInitialPaymentsHistoryState();

  return (
    <PaymentsHistoryProvider {...paymentHistory}>
      <PaymentsHistoryTable source="database" />
    </PaymentsHistoryProvider>
  );
}

export default function AdminPaymentHistoryPage() {
  return (
    <DashboardPage route="/admin/payment-history" width="wide">
      <Section>
        <Suspense fallback={<AdminDataTableSkeleton stats={2} />}>
          <PaymentsHistoryContent />
        </Suspense>
      </Section>
    </DashboardPage>
  );
}
