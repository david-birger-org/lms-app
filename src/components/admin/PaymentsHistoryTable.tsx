"use client";

import { useTranslations } from "next-intl";

import { DateRangePicker } from "@/components/admin/DateRangePicker";
import { MonobankPaymentsDataTable } from "@/components/admin/MonobankPaymentsDataTable";
import { usePaymentsFeed } from "@/components/admin/PaymentsDataProvider";
import type { PaymentDetailsSource } from "@/lib/payments";

function buildDescription({
  description,
  lastFetchedAt,
  source,
  defaultDescription,
  lastSyncedLabel,
}: {
  description?: string;
  lastFetchedAt: number | null;
  source: PaymentDetailsSource;
  defaultDescription: string;
  lastSyncedLabel: (params: { time: string }) => string;
}) {
  const baseDescription = description ?? defaultDescription;

  if (source !== "database" || !lastFetchedAt) return baseDescription;

  return `${baseDescription} ${lastSyncedLabel({ time: new Date(lastFetchedAt).toLocaleTimeString() })}`;
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
  const t = useTranslations("admin.paymentsHistory");
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
        title={title ?? t(`titles.${source}`)}
        description={buildDescription({
          description,
          lastFetchedAt: meta.lastFetchedAt,
          source,
          defaultDescription: t(`descriptions.${source}`),
          lastSyncedLabel: (params) => t("lastSynced", params),
        })}
      />
    </div>
  );
}
