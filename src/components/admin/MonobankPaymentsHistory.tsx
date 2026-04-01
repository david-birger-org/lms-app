"use client";

import { MonobankPaymentsDataTable } from "@/components/admin/MonobankPaymentsDataTable";
import { useMonobankStatement } from "@/components/admin/MonobankStatementProvider";
import type { PaymentDetailsSource } from "@/lib/payments";

export function MonobankPaymentsHistory({
  title = "Provider statement",
  description = "Inspect the live Monobank statement feed for provider-side reconciliation.",
  detailsSource = "provider",
}: {
  title?: string;
  description?: string;
  detailsSource?: PaymentDetailsSource;
}) {
  const { state, actions } = useMonobankStatement();

  return (
    <div className="space-y-4">
      {state.error && (
        <p className="text-destructive border-destructive/40 bg-destructive/5 rounded-2xl border px-4 py-3 text-sm">
          {state.error}
        </p>
      )}
      <MonobankPaymentsDataTable
        data={state.rows}
        isLoading={state.isLoading}
        onRefresh={() => void actions.refresh()}
        onInvoiceChanged={() => void actions.refresh()}
        detailsSource={detailsSource}
        title={title}
        description={description}
      />
    </div>
  );
}
