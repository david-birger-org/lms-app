import { PendingInvoicesTable } from "@/components/admin/PendingInvoicesTable";
import { DashboardPage } from "@/components/dashboard/page-shell";
import { Section } from "@/components/shell/page";

export default function AdminPendingInvoicesPage() {
  return (
    <DashboardPage route="/admin/pending" width="wide">
      <Section>
        <PendingInvoicesTable />
      </Section>
    </DashboardPage>
  );
}
