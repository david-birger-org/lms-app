import { MonobankInvoiceForm } from "@/components/admin/MonobankInvoiceForm";
import { DashboardPage } from "@/components/dashboard/page-shell";
import { Section } from "@/components/shell/page";

export default function AdminInvoicePage() {
  return (
    <DashboardPage route="/admin/invoice">
      <Section>
        <MonobankInvoiceForm />
      </Section>
    </DashboardPage>
  );
}
