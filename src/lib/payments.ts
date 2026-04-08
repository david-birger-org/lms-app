import { normalizeStatementRows, type StatementItem } from "@/lib/monobank";

export const DEFAULT_PAYMENT_HISTORY_RANGE_DAYS = 90;

export type PaymentDetailsSource = "database" | "provider";

export interface PaymentHistorySnapshot {
  rows: StatementItem[];
  fetchedAt: number;
}

export function normalizePaymentHistoryRows(list: StatementItem[]) {
  return normalizeStatementRows(list);
}

export function normalizePaymentStatus(status?: string | null) {
  const normalizedStatus = status?.trim().toLowerCase();
  return normalizedStatus ? normalizedStatus : null;
}

export function isSuccessfulPaymentStatus(status?: string | null) {
  const normalizedStatus = normalizePaymentStatus(status);
  return normalizedStatus === "paid" || normalizedStatus === "success";
}

export function isFailedPaymentStatus(status?: string | null) {
  const normalizedStatus = normalizePaymentStatus(status);

  return (
    normalizedStatus === "failed" ||
    normalizedStatus === "failure" ||
    normalizedStatus === "expired" ||
    normalizedStatus === "reversed"
  );
}
