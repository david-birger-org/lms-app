import type { ReactNode } from "react";

import { getPaymentStatusKind, type PaymentStatusKind } from "@/lib/payments";
import { cn } from "@/lib/utils";

export type Status = "success" | "warning" | "error" | "neutral";

const dotClass: Record<Status, string> = {
  success: "bg-success",
  warning: "bg-warning",
  error: "bg-destructive",
  neutral: "bg-gray-700",
};

/** Vercel-style status pill: a colored dot plus a text label. */
export function StatusBadge({
  children,
  className,
  status,
}: {
  children: ReactNode;
  className?: string;
  status: Status;
}) {
  return (
    <span
      data-slot="status-badge"
      data-status={status}
      className={cn(
        "inline-flex h-6 w-fit shrink-0 items-center gap-1.5 rounded-full border bg-background px-2 text-xs font-medium whitespace-nowrap text-foreground",
        className,
      )}
    >
      <span
        aria-hidden
        className={cn("size-1.5 shrink-0 rounded-full", dotClass[status])}
      />
      {children}
    </span>
  );
}

const paymentKindStatus: Record<PaymentStatusKind, Status> = {
  paid: "success",
  pending: "warning",
  failed: "error",
  draft: "neutral",
  unknown: "neutral",
};

/** Maps any payment status string onto a StatusBadge tone. */
export function getPaymentBadgeStatus(status?: string | null): Status {
  return paymentKindStatus[getPaymentStatusKind(status)];
}
