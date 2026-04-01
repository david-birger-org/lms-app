"use client";

import { MonobankPaymentsDataTable } from "@/components/admin/MonobankPaymentsDataTable";
import { usePaymentsHistory } from "@/components/admin/PaymentsHistoryProvider";

export function AppPaymentsHistory() {
  const { state, actions, meta } = usePaymentsHistory();

  return (
    <div className="space-y-4">
      {state.error ? (
        <p className="text-destructive border-destructive/40 bg-destructive/5 rounded-2xl border px-4 py-3 text-sm">
          {state.error}
        </p>
      ) : null}
      <MonobankPaymentsDataTable
        data={state.rows}
        isLoading={state.isLoading}
        onRefresh={() => void actions.refresh()}
        onInvoiceChanged={() => void actions.refresh()}
        detailsSource="database"
        title="Payment history"
        description={`Canonical app payment history from the payments table. Use the statement audit page to reconcile against the live Monobank feed.${meta.lastFetchedAt ? ` Last synced ${new Date(meta.lastFetchedAt).toLocaleTimeString()}.` : ""}`}
      />
    </div>
  );
}
