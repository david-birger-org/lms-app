import type { PaymentDetails } from "@/components/admin/payment-details/types";
import type { StatementItem } from "@/lib/monobank";

const EXTENDED_DETAILS_FALLBACK_MESSAGE =
  "Extended payment details are temporarily unavailable. Showing statement data instead.";

export function getPaymentDetailsErrorMessage(error: unknown) {
  const rawMessage = error instanceof Error ? error.message : "";

  if (/could not determine data type of parameter/i.test(rawMessage)) {
    return EXTENDED_DETAILS_FALLBACK_MESSAGE;
  }

  return rawMessage || EXTENDED_DETAILS_FALLBACK_MESSAGE;
}

export function normalizePaymentStatus(status?: string) {
  const normalizedStatus = status?.trim().toLowerCase();
  return normalizedStatus ? normalizedStatus : null;
}

export function isCancelableInvoiceStatus(status?: string) {
  const normalizedStatus = normalizePaymentStatus(status);

  return (
    normalizedStatus === "created" || normalizedStatus === "invoice_created"
  );
}

export function shouldAutoRefreshInvoiceStatus(status?: string) {
  const normalizedStatus = normalizePaymentStatus(status);

  return (
    normalizedStatus === "created" ||
    normalizedStatus === "invoice_created" ||
    normalizedStatus === "processing" ||
    normalizedStatus === "hold"
  );
}

export function mergeUpdatedDetails({
  current,
  payload,
  payment,
  invoiceId,
}: {
  current: PaymentDetails | null;
  payload: PaymentDetails;
  payment?: StatementItem;
  invoiceId: string;
}) {
  return {
    ...(current ?? {}),
    ...payload,
    expiresAt: payload.expiresAt ?? current?.expiresAt ?? payment?.expiresAt,
    invoiceId: payload.invoiceId ?? invoiceId,
    pageUrl: payload.pageUrl ?? current?.pageUrl ?? payment?.pageUrl,
    status: payload.status ?? current?.status ?? "cancelled",
  } satisfies PaymentDetails;
}

export function getCancelErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Failed to cancel invoice";
}

export function shouldLoadDetails({
  details,
  effectiveInvoiceId,
  error,
  hideTrigger,
  isLoading,
  open,
  warning,
}: {
  details: PaymentDetails | null;
  effectiveInvoiceId?: string;
  error: string | null;
  hideTrigger: boolean;
  isLoading: boolean;
  open: boolean;
  warning: string | null;
}) {
  return (
    hideTrigger &&
    open &&
    !details &&
    !error &&
    !warning &&
    !isLoading &&
    Boolean(effectiveInvoiceId)
  );
}

export function mergePaymentDetails(
  summary?: StatementItem,
  details?: PaymentDetails | null,
) {
  if (!summary && !details) {
    return null;
  }

  const paymentInfo = {
    ...details?.paymentInfo,
    maskedPan: details?.paymentInfo?.maskedPan ?? summary?.maskedPan,
  };

  return {
    ...details,
    customerName: details?.customerName ?? summary?.customerName,
    invoiceId: details?.invoiceId ?? summary?.invoiceId,
    status: details?.status ?? summary?.status,
    amount: details?.amount ?? summary?.amount,
    profitAmount: details?.profitAmount ?? summary?.profitAmount,
    ccy: details?.ccy ?? details?.currency ?? summary?.ccy,
    createdDate: details?.createdDate ?? summary?.date,
    reference: details?.reference ?? summary?.reference,
    destination: details?.destination ?? summary?.destination,
    expiresAt: details?.expiresAt ?? summary?.expiresAt,
    pageUrl: details?.pageUrl ?? summary?.pageUrl,
    paymentInfo: Object.values(paymentInfo).some(Boolean)
      ? paymentInfo
      : undefined,
  } satisfies PaymentDetails;
}
