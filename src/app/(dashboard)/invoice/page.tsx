import { MonobankInvoiceForm } from "@/components/admin/MonobankInvoiceForm";
import {
  DashboardPage,
  DashboardSection,
} from "@/components/dashboard/page-shell";

export default function InvoicePage() {
  return (
    <DashboardPage>
      <DashboardSection>
        <MonobankInvoiceForm />
      </DashboardSection>
    </DashboardPage>
  );
}
