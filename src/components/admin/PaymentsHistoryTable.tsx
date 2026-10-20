"use client";

import { useTranslations } from "next-intl";

import { AdminAlert } from "@/components/admin/AdminDataTableShell";
import { DateRangePicker } from "@/components/admin/DateRangePicker";
import { MonobankPaymentsDataTable } from "@/components/admin/MonobankPaymentsDataTable";
import { usePaymentsFeed } from "@/components/admin/PaymentsDataProvider";
import type { PaymentDetailsSource } from "@/lib/payments";

export function PaymentsHistoryTable({
  source,
}: {
  source: PaymentDetailsSource;
}) {
  const t = useTranslations("admin.paymentsHistory");
  const { state, actions, meta } = usePaymentsFeed(source);
  const maxDays = source === "provider" ? 31 : undefined;
  const lastSynced =
    source === "database" && meta.lastFetchedAt
      ? t("lastSynced", {
          time: new Date(meta.lastFetchedAt).toLocaleTimeString(),
        })
      : undefined;

  return (
    <div className="flex min-w-0 flex-col gap-4">
      {state.error ? <AdminAlert>{state.error}</AdminAlert> : null}
      <MonobankPaymentsDataTable
        data={state.rows}
        isLoading={state.isLoading}
        onRefresh={() => void actions.refresh()}
        onInvoiceChanged={() => void actions.refresh()}
        detailsSource={source}
        description={lastSynced}
        toolbarLeading={
          <DateRangePicker
            range={meta.range}
            onChange={actions.setRange}
            disabled={state.isLoading}
            maxDays={maxDays}
          />
        }
      />
    </div>
  );
}
