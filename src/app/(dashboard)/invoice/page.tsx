import { MonobankInvoiceWorkspace } from "@/components/admin/MonobankInvoiceWorkspace";
import {
  DashboardPage,
  DashboardSection,
} from "@/components/dashboard/page-shell";

export default function InvoicePage() {
  return (
    <DashboardPage route="/invoice">
      <DashboardSection>
        <MonobankInvoiceWorkspace />
      </DashboardSection>
    </DashboardPage>
  );
}
