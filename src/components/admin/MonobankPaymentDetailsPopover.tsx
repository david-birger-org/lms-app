"use client";

import {
  AlertTriangle,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  Eye,
  LoaderCircle,
  ReceiptText,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  formatMonobankDate,
  formatMonobankMoney,
  type MonobankCurrency,
  type StatementItem,
} from "@/lib/monobank";
import { cn } from "@/lib/utils";

export interface PaymentDetails {
  invoiceId?: string;
  status?: string;
  failureReason?: string;
  errCode?: string;
  amount?: number;
  ccy?: MonobankCurrency;
  currency?: MonobankCurrency;
  finalAmount?: number;
  createdDate?: string;
  modifiedDate?: string;
  reference?: string;
  destination?: string;
  customerName?: string;
  expiresAt?: string;
  pageUrl?: string;
  paymentInfo?: {
    maskedPan?: string;
    approvalCode?: string;
    rrn?: string;
    tranId?: string;
    terminal?: string;
    bank?: string;
    paymentSystem?: string;
  };
  error?: string;
}

const EXTENDED_DETAILS_FALLBACK_MESSAGE =
  "Extended payment details are temporarily unavailable. Showing statement data instead.";

function getPaymentDetailsErrorMessage(error: unknown) {
  const rawMessage = error instanceof Error ? error.message : "";

  if (/could not determine data type of parameter/i.test(rawMessage)) {
    return EXTENDED_DETAILS_FALLBACK_MESSAGE;
  }

  return rawMessage || EXTENDED_DETAILS_FALLBACK_MESSAGE;
}

function mergePaymentDetails(
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

function DetailCard({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-background/80 p-4 shadow-xs backdrop-blur-sm">
      <p className="text-muted-foreground text-[11px] font-medium uppercase tracking-[0.18em]">
        {label}
      </p>
      <p
        className={cn(
          "mt-2 text-sm leading-relaxed sm:text-[15px]",
          mono && "break-all font-mono text-[11px] sm:text-xs",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function getStatusAppearance(status?: string) {
  const normalizedStatus = status?.toLowerCase();

  if (normalizedStatus === "success") {
    return {
      label: "Success",
      icon: CheckCircle2,
      className:
        "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-500/10 dark:text-emerald-300",
    };
  }

  if (normalizedStatus === "processing" || normalizedStatus === "hold") {
    return {
      label: status ?? "Pending",
      icon: AlertTriangle,
      className:
        "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-500/10 dark:text-amber-300",
    };
  }

  if (normalizedStatus === "failure") {
    return {
      label: "Failure",
      icon: XCircle,
      className:
        "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-500/10 dark:text-rose-300",
    };
  }

  if (
    normalizedStatus === "invoice_created" ||
    normalizedStatus === "created"
  ) {
    return {
      label: "Pending",
      icon: AlertTriangle,
      className:
        "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/60 dark:bg-sky-500/10 dark:text-sky-300",
    };
  }

  if (normalizedStatus === "paid") {
    return {
      label: "Paid",
      icon: CheckCircle2,
      className:
        "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-500/10 dark:text-emerald-300",
    };
  }

  if (normalizedStatus === "failed") {
    return {
      label: "Failed",
      icon: XCircle,
      className:
        "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-500/10 dark:text-rose-300",
    };
  }

  if (normalizedStatus === "cancelled") {
    return {
      label: "Cancelled",
      icon: XCircle,
      className:
        "border-border bg-muted/40 text-muted-foreground dark:bg-muted/20",
    };
  }

  return {
    label: status ?? "Unknown",
    icon: ReceiptText,
    className:
      "border-border bg-muted/40 text-muted-foreground dark:bg-muted/20",
  };
}

function PaymentDetailsBody({
  isLoading,
  error,
  warning,
  details,
  summary,
}: {
  isLoading: boolean;
  error: string | null;
  warning: string | null;
  details: PaymentDetails | null;
  summary?: StatementItem;
}) {
  const displayDetails = mergePaymentDetails(summary, details);
  const paymentInfo = displayDetails?.paymentInfo;
  const statusAppearance = getStatusAppearance(displayDetails?.status);
  const StatusIcon = statusAppearance.icon;
  const topLevelDetails = [
    { label: "Status", value: displayDetails?.status ?? "-" },
    {
      label: "Amount",
      value: formatMonobankMoney(displayDetails?.amount, displayDetails?.ccy),
    },
    {
      label: "Final amount",
      value:
        typeof displayDetails?.finalAmount === "number"
          ? formatMonobankMoney(displayDetails.finalAmount, displayDetails.ccy)
          : null,
    },
    { label: "Card", value: paymentInfo?.maskedPan ?? "-" },
  ].filter(
    (item): item is { label: string; value: string } => item.value !== null,
  );

  const secondaryDetails = [
    {
      label: details?.createdDate ? "Created" : "Statement date",
      value: formatMonobankDate(displayDetails?.createdDate),
    },
    details?.modifiedDate
      ? {
          label: "Updated",
          value: formatMonobankDate(details.modifiedDate),
        }
      : null,
    paymentInfo?.bank ? { label: "Bank", value: paymentInfo.bank } : null,
    paymentInfo?.paymentSystem
      ? { label: "Payment system", value: paymentInfo.paymentSystem }
      : null,
    paymentInfo?.approvalCode
      ? { label: "Approval code", value: paymentInfo.approvalCode }
      : null,
    paymentInfo?.rrn ? { label: "RRN", value: paymentInfo.rrn } : null,
    paymentInfo?.terminal
      ? { label: "Terminal", value: paymentInfo.terminal }
      : null,
    paymentInfo?.tranId
      ? { label: "Transaction ID", value: paymentInfo.tranId, mono: true }
      : null,
    displayDetails?.customerName
      ? { label: "Customer", value: displayDetails.customerName }
      : null,
    displayDetails?.expiresAt
      ? {
          label: "Expires",
          value: formatMonobankDate(displayDetails.expiresAt),
        }
      : null,
    displayDetails?.reference
      ? { label: "Reference", value: displayDetails.reference, mono: true }
      : null,
  ].filter(
    (
      item,
    ): item is {
      label: string;
      value: string;
      mono?: boolean;
    } => item !== null,
  );

  if (isLoading && !displayDetails) {
    return (
      <p className="text-muted-foreground text-sm">
        Loading payment details...
      </p>
    );
  }

  if (error) {
    return (
      <p className="text-destructive border-destructive/40 bg-destructive/5 rounded-lg border px-3 py-2 text-sm">
        {error}
      </p>
    );
  }

  if (!displayDetails) {
    return (
      <p className="text-muted-foreground text-sm">
        Open a payment to view its details.
      </p>
    );
  }

  return (
    <div className="space-y-5 text-sm sm:space-y-6">
      {warning ? (
        <p className="border-amber-300/70 bg-amber-50 text-amber-900 rounded-lg border px-3 py-2 text-sm dark:border-amber-700/60 dark:bg-amber-500/10 dark:text-amber-200">
          {warning}
        </p>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-background via-background to-muted/30 shadow-sm">
        <div className="grid gap-5 p-4 sm:p-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.9fr)] lg:gap-6">
          <div className="space-y-4 sm:space-y-5">
            <div className="flex flex-wrap items-center gap-3">
              <Badge
                variant="outline"
                className={cn(
                  "h-7 gap-1.5 rounded-full px-3 text-xs capitalize",
                  statusAppearance.className,
                )}
              >
                <StatusIcon className="size-3.5" />
                {statusAppearance.label}
              </Badge>
              <Badge
                variant="outline"
                className="h-7 rounded-full px-3 text-xs"
              >
                Invoice {displayDetails.invoiceId ?? "-"}
              </Badge>
            </div>

            <div className="space-y-2">
              <p className="text-muted-foreground text-[11px] font-medium uppercase tracking-[0.22em]">
                Payment summary
              </p>
              <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
                <div>
                  <p className="text-muted-foreground text-xs">Amount</p>
                  <p className="text-2xl font-semibold tracking-tight sm:text-3xl">
                    {formatMonobankMoney(
                      displayDetails.amount,
                      displayDetails.ccy,
                    )}
                  </p>
                </div>
                {typeof displayDetails.finalAmount === "number" ? (
                  <div>
                    <p className="text-muted-foreground text-xs">
                      Final amount
                    </p>
                    <p className="text-base font-medium sm:text-lg">
                      {formatMonobankMoney(
                        displayDetails.finalAmount,
                        displayDetails.ccy,
                      )}
                    </p>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="rounded-xl border border-border/60 bg-muted/20 p-4 sm:p-5">
              <div className="mb-3 flex items-center gap-2">
                <ReceiptText className="text-muted-foreground size-4" />
                <p className="text-sm font-medium">Description</p>
              </div>
              <p className="text-sm leading-6 sm:text-[15px]">
                {displayDetails.destination ?? "-"}
              </p>
              {displayDetails.pageUrl ? (
                <a
                  href={displayDetails.pageUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary mt-3 inline-flex items-center gap-1 text-sm underline underline-offset-4"
                >
                  Open checkout link
                  <ExternalLink className="size-3.5" />
                </a>
              ) : null}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <div className="rounded-xl border border-border/60 bg-background/80 p-4 shadow-xs">
              <div className="mb-3 flex items-center gap-2">
                <CreditCard className="text-muted-foreground size-4" />
                <p className="text-sm font-medium">Quick facts</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                {topLevelDetails.slice(1).map((item) => (
                  <DetailCard
                    key={item.label}
                    label={item.label}
                    value={item.value}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {secondaryDetails.map((item) => (
          <DetailCard
            key={item.label}
            label={item.label}
            value={item.value}
            mono={item.mono}
          />
        ))}
      </div>

      {(displayDetails.failureReason || displayDetails.errCode) && (
        <div className="grid gap-3 sm:grid-cols-2">
          <DetailCard
            label="Failure reason"
            value={displayDetails.failureReason ?? "-"}
          />
          <DetailCard
            label="Error code"
            value={displayDetails.errCode ?? "-"}
          />
        </div>
      )}
    </div>
  );
}

export function MonobankPaymentDetailsPopover({
  invoiceId,
  payment,
  open: controlledOpen,
  onOpenChange,
  onInvoiceChanged,
  hideTrigger = false,
}: {
  invoiceId?: string;
  payment?: StatementItem;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onInvoiceChanged?: () => void;
  hideTrigger?: boolean;
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const [details, setDetails] = useState<PaymentDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancellationError, setCancellationError] = useState<string | null>(
    null,
  );
  const effectiveInvoiceId = invoiceId ?? payment?.invoiceId;
  const previousInvoiceId = useRef(effectiveInvoiceId);

  const open = controlledOpen ?? uncontrolledOpen;

  const loadDetails = useCallback(async () => {
    if (!effectiveInvoiceId) {
      return;
    }

    setIsLoading(true);
    setError(null);
    setWarning(null);

    try {
      const response = await fetch(
        `/api/monobank/invoice/status?invoiceId=${encodeURIComponent(effectiveInvoiceId)}`,
        {
          method: "GET",
          cache: "no-store",
        },
      );

      const payload = (await response.json()) as PaymentDetails;

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to load payment details");
      }

      setDetails(payload);
    } catch (loadError) {
      const message = getPaymentDetailsErrorMessage(loadError);

      console.error("Failed to load extended payment details", loadError);
      setDetails(null);

      if (payment) {
        setWarning(message);
      } else {
        setError(message);
      }
    } finally {
      setIsLoading(false);
    }
  }, [effectiveInvoiceId, payment]);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      onOpenChange?.(nextOpen);

      if (controlledOpen === undefined) {
        setUncontrolledOpen(nextOpen);
      }

      if (nextOpen && !details && !isLoading && effectiveInvoiceId) {
        void loadDetails();
      }
    },
    [
      controlledOpen,
      details,
      effectiveInvoiceId,
      isLoading,
      loadDetails,
      onOpenChange,
    ],
  );

  useEffect(() => {
    if (previousInvoiceId.current !== effectiveInvoiceId) {
      previousInvoiceId.current = effectiveInvoiceId;
      setCancellationError(null);
      setDetails(null);
      setError(null);
      setWarning(null);
    }
  }, [effectiveInvoiceId]);

  const displayDetails = mergePaymentDetails(payment, details);
  const normalizedStatus = displayDetails?.status?.toLowerCase();
  const canCancelInvoice =
    Boolean(effectiveInvoiceId) &&
    (normalizedStatus === "created" || normalizedStatus === "invoice_created");

  const handleCancelInvoice = useCallback(async () => {
    if (!effectiveInvoiceId || !canCancelInvoice || isCancelling) {
      return;
    }

    if (
      !window.confirm(
        "Cancel this unpaid invoice? This action cannot be undone.",
      )
    ) {
      return;
    }

    setIsCancelling(true);
    setCancellationError(null);

    try {
      const response = await fetch("/api/monobank/invoice/remove", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ invoiceId: effectiveInvoiceId }),
      });

      const payload = (await response.json()) as PaymentDetails;

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to cancel invoice");
      }

      setDetails((current) => ({
        ...(current ?? {}),
        expiresAt: current?.expiresAt ?? payment?.expiresAt,
        invoiceId: effectiveInvoiceId,
        pageUrl: current?.pageUrl ?? payment?.pageUrl,
        status: "cancelled",
      }));
      onInvoiceChanged?.();
    } catch (cancelError) {
      setCancellationError(
        cancelError instanceof Error
          ? cancelError.message
          : "Failed to cancel invoice",
      );
    } finally {
      setIsCancelling(false);
    }
  }, [
    canCancelInvoice,
    effectiveInvoiceId,
    isCancelling,
    onInvoiceChanged,
    payment?.expiresAt,
    payment?.pageUrl,
  ]);

  useEffect(() => {
    if (
      hideTrigger &&
      open &&
      !details &&
      !error &&
      !warning &&
      !isLoading &&
      effectiveInvoiceId
    ) {
      void loadDetails();
    }
  }, [
    details,
    effectiveInvoiceId,
    error,
    hideTrigger,
    isLoading,
    loadDetails,
    open,
    warning,
  ]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {hideTrigger ? null : (
        <DialogTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Open payment details"
            disabled={!effectiveInvoiceId}
          >
            <Eye />
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-[calc(100vw-2rem)] gap-0 p-0 sm:max-w-5xl xl:max-w-6xl">
        <DialogHeader className="border-b bg-muted/20 px-4 py-4 sm:px-6 sm:py-5">
          <DialogTitle className="text-base sm:text-lg">
            Payment details
          </DialogTitle>
          <DialogDescription className="break-all font-mono text-[11px] sm:text-xs">
            {effectiveInvoiceId ?? "-"}
          </DialogDescription>
          {canCancelInvoice ? (
            <div className="pt-3">
              <Button
                type="button"
                variant="destructive"
                size="sm"
                disabled={isCancelling}
                onClick={() => void handleCancelInvoice()}
              >
                {isCancelling ? (
                  <>
                    <LoaderCircle className="animate-spin" />
                    Cancelling...
                  </>
                ) : (
                  "Cancel invoice"
                )}
              </Button>
            </div>
          ) : null}
        </DialogHeader>
        <div className="max-h-[85vh] overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
          {cancellationError ? (
            <p className="text-destructive border-destructive/40 bg-destructive/5 mb-4 rounded-lg border px-3 py-2 text-sm">
              {cancellationError}
            </p>
          ) : null}
          <PaymentDetailsBody
            isLoading={isLoading}
            error={error}
            warning={warning}
            details={details}
            summary={payment}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
