import { normalizeStatementRows, type StatementItem } from "@/lib/monobank";

export const DEFAULT_PAYMENT_HISTORY_RANGE_DAYS = 90;

export type PaymentDetailsSource = "database" | "provider";

export interface PaymentHistorySnapshot {
  rows: StatementItem[];
  fetchedAt: number;
}

export const canonicalPaymentStatuses = [
  "draft",
  "creating_invoice",
  "creation_failed",
  "invoice_created",
  "processing",
  "paid",
  "failed",
  "expired",
  "cancelled",
  "reversed",
] as const;

export type CanonicalPaymentStatus = (typeof canonicalPaymentStatuses)[number];

export const monobankProviderStatuses = [
  "created",
  "processing",
  "hold",
  "success",
  "failure",
  "expired",
  "cancelled",
  "reversed",
  "refunded",
] as const;

export type MonobankProviderStatus = (typeof monobankProviderStatuses)[number];

export type PaymentStatusKind =
  | "draft"
  | "pending"
  | "paid"
  | "failed"
  | "unknown";

const canonicalPaymentStatusSet = new Set<string>(canonicalPaymentStatuses);
const monobankProviderStatusSet = new Set<string>(monobankProviderStatuses);
const pendingPaymentStatusSet = new Set<CanonicalPaymentStatus>([
  "creating_invoice",
  "invoice_created",
  "processing",
]);
const failedPaymentStatusSet = new Set<CanonicalPaymentStatus>([
  "creation_failed",
  "failed",
  "expired",
  "cancelled",
  "reversed",
]);

const canonicalByProviderStatus: Record<
  MonobankProviderStatus,
  CanonicalPaymentStatus
> = {
  cancelled: "cancelled",
  created: "invoice_created",
  expired: "expired",
  failure: "failed",
  hold: "processing",
  processing: "processing",
  refunded: "reversed",
  reversed: "reversed",
  success: "paid",
};

export function normalizePaymentHistoryRows(list: StatementItem[]) {
  return normalizeStatementRows(list);
}

export function normalizePaymentStatus(status?: string | null) {
  const normalizedStatus = status?.trim().toLowerCase();
  return normalizedStatus ? normalizedStatus : null;
}

export function parseCanonicalPaymentStatus(
  status?: string | null,
): CanonicalPaymentStatus | null {
  const normalizedStatus = normalizePaymentStatus(status);

  if (!normalizedStatus || !canonicalPaymentStatusSet.has(normalizedStatus)) {
    return null;
  }

  return normalizedStatus as CanonicalPaymentStatus;
}

export function parseMonobankProviderStatus(
  status?: string | null,
): MonobankProviderStatus | null {
  const normalizedStatus = normalizePaymentStatus(status);

  if (!normalizedStatus || !monobankProviderStatusSet.has(normalizedStatus)) {
    return null;
  }

  return normalizedStatus as MonobankProviderStatus;
}

export function resolvePaymentStatus(
  status?: string | null,
): CanonicalPaymentStatus | null {
  const canonicalStatus = parseCanonicalPaymentStatus(status);
  if (canonicalStatus) return canonicalStatus;

  const providerStatus = parseMonobankProviderStatus(status);
  if (!providerStatus) return null;

  return canonicalByProviderStatus[providerStatus];
}

export function getPaymentStatusKind(
  status?: string | null,
): PaymentStatusKind {
  const canonicalStatus = resolvePaymentStatus(status);

  if (!canonicalStatus) return "unknown";
  if (canonicalStatus === "draft") return "draft";
  if (canonicalStatus === "paid") return "paid";
  if (pendingPaymentStatusSet.has(canonicalStatus)) return "pending";
  if (failedPaymentStatusSet.has(canonicalStatus)) return "failed";

  return "unknown";
}

export function isSuccessfulPaymentStatus(status?: string | null) {
  return resolvePaymentStatus(status) === "paid";
}

export function isFailedPaymentStatus(status?: string | null) {
  const canonicalStatus = resolvePaymentStatus(status);
  return canonicalStatus ? failedPaymentStatusSet.has(canonicalStatus) : false;
}

export function isPendingPaymentStatus(status?: string | null) {
  const canonicalStatus = resolvePaymentStatus(status);
  return canonicalStatus ? pendingPaymentStatusSet.has(canonicalStatus) : false;
}
