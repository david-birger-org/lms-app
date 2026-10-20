import { Loader2, Lock } from "lucide-react";
import type { ReactNode } from "react";

import { FormAlert } from "@/components/auth/public-page";
import { Button } from "@/components/ui/button";

export interface OrderSummaryRow {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
}

/** Product, payer and the total, with the total in mono. */
export function OrderSummary({
  label,
  rows,
  total,
  totalLabel,
}: {
  label: string;
  rows: OrderSummaryRow[];
  total: string;
  totalLabel: string;
}) {
  return (
    <section
      aria-label={label}
      className="rounded-xl border bg-background shadow-card"
    >
      <dl className="flex flex-col divide-y">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-start justify-between gap-4 px-4 py-3.5 sm:px-5"
          >
            <dt className="shrink-0 text-sm text-muted-foreground">
              {row.label}
            </dt>
            <dd className="flex min-w-0 flex-col items-end gap-0.5 text-end">
              <span className="text-sm font-medium text-pretty break-words">
                {row.value}
              </span>
              {row.detail ? (
                <span className="max-w-full truncate text-[0.8125rem] text-muted-foreground">
                  {row.detail}
                </span>
              ) : null}
            </dd>
          </div>
        ))}
      </dl>
      <div className="flex items-baseline justify-between gap-4 rounded-b-xl border-t bg-background-200 px-4 py-4 sm:px-5">
        <span className="text-sm font-medium">{totalLabel}</span>
        <span className="font-numeric text-xl font-semibold tracking-tight">
          {total}
        </span>
      </div>
    </section>
  );
}

/**
 * The single primary action. A sticky bottom bar with safe-area padding under
 * 640px, inline from 640px.
 */
export function CheckoutActionBar({
  error,
  isSubmitting,
  label,
  note,
  onConfirm,
  submittingLabel,
}: {
  error: string | null;
  isSubmitting: boolean;
  label: string;
  note: string;
  onConfirm: () => void;
  submittingLabel: string;
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-10 border-t bg-background pb-safe sm:static sm:border-0 sm:bg-transparent sm:pb-0">
      <div className="mx-auto flex w-full max-w-md flex-col gap-3 px-4 py-3 sm:p-0">
        {error ? <FormAlert>{error}</FormAlert> : null}
        <Button
          aria-busy={isSubmitting || undefined}
          className="w-full"
          disabled={isSubmitting}
          onClick={onConfirm}
          size="lg"
          type="button"
        >
          {isSubmitting ? (
            <Loader2 aria-hidden className="animate-spin" />
          ) : (
            <Lock aria-hidden />
          )}
          {isSubmitting ? submittingLabel : label}
        </Button>
        <p className="text-center text-xs text-pretty text-muted-foreground">
          {note}
        </p>
      </div>
    </div>
  );
}
