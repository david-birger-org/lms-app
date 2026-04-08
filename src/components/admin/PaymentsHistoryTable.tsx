"use client";

import { DateRangePicker } from "@/components/admin/DateRangePicker";
import { MonobankPaymentsDataTable } from "@/components/admin/MonobankPaymentsDataTable";
import { usePaymentsFeed } from "@/components/admin/PaymentsDataProvider";
import type { PaymentDetailsSource } from "@/lib/payments";

const defaultTitles: Record<PaymentDetailsSource, string> = {
  database: "Payment history",
  provider: "Provider statement",
};

const defaultDescriptions: Record<PaymentDetailsSource, string> = {
  database:
    "Canonical app payment history from the payments table. Use the statement audit page to reconcile against the live Monobank feed.",
  provider:
    "Inspect the live Monobank statement feed for provider-side reconciliation.",
};

function buildDescription({
  description,
  lastFetchedAt,
  source,
}: {
  description?: string;
  lastFetchedAt: number | null;
  source: PaymentDetailsSource;
}) {
  const baseDescription = description ?? defaultDescriptions[source];

  if (source !== "database" || !lastFetchedAt) {
    return baseDescription;
  }

  return `${baseDescription} Last synced ${new Date(lastFetchedAt).toLocaleTimeString()}.`;
}

export function PaymentsHistoryTable({
  source,
  title,
  description,
}: {
  source: PaymentDetailsSource;
  title?: string;
  description?: string;
}) {
  const { state, actions, meta } = usePaymentsFeed(source);
  const maxDays = source === "provider" ? 31 : undefined;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <DateRangePicker
          range={meta.range}
          onChange={actions.setRange}
          disabled={state.isLoading}
          maxDays={maxDays}
        />
      </div>
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
        detailsSource={source}
        title={title ?? defaultTitles[source]}
        description={buildDescription({
          description,
          lastFetchedAt: meta.lastFetchedAt,
          source,
        })}
      />
    </div>
  );
}
