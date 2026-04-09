"use client";

import {
  AlertTriangle,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  Info,
  ReceiptText,
  XCircle,
} from "lucide-react";
import { useTranslations } from "next-intl";
import type { PaymentDetails } from "@/components/admin/payment-details/types";
import {
  mergePaymentDetails,
  normalizePaymentStatus,
} from "@/components/admin/payment-details/utils";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  formatCountryCode,
  formatMonobankDate,
  formatMonobankMoney,
  type StatementItem,
} from "@/lib/monobank";
import { cn } from "@/lib/utils";

function HintIcon({ text }: { text: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          tabIndex={-1}
          aria-label={text}
          className="text-muted-foreground/70 hover:text-muted-foreground inline-flex items-center"
        >
          <Info className="size-3" />
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-[260px] text-xs leading-relaxed">
        {text}
      </TooltipContent>
    </Tooltip>
  );
}

function stringifyDetailValue(value?: number | string) {
  return value === undefined || value === null ? "-" : String(value);
}

function DetailCard({
  label,
  value,
  mono = false,
  hint,
}: {
  label: string;
  value: string;
  mono?: boolean;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-background/80 p-4 shadow-xs backdrop-blur-sm">
      <p className="text-muted-foreground inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.18em]">
        {label}
        {hint ? <HintIcon text={hint} /> : null}
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

function PaymentSummarySection({
  amount,
  ccy,
  destination,
  profitAmount,
  pageUrl,
  t,
}: {
  amount?: number;
  ccy?: PaymentDetails["ccy"];
  destination?: string;
  profitAmount?: number;
  pageUrl?: string;
  t: (key: string) => string;
}) {
  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="space-y-2">
        <p className="text-muted-foreground text-[11px] font-medium uppercase tracking-[0.22em]">
          {t("summary.title")}
        </p>
        <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
          <div>
            <p className="text-muted-foreground inline-flex items-center gap-1.5 text-xs">
              {t("summary.amount")}
              <HintIcon text={t("hints.amount")} />
            </p>
            <p className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {formatMonobankMoney(amount, ccy)}
            </p>
          </div>
          {typeof profitAmount === "number" ? (
            <div>
              <p className="text-muted-foreground inline-flex items-center gap-1.5 text-xs">
                {t("summary.profitAmount")}
                <HintIcon text={t("hints.profitAmount")} />
              </p>
              <p className="text-base font-medium sm:text-lg">
                {formatMonobankMoney(profitAmount, ccy)}
              </p>
            </div>
          ) : null}
        </div>
      </div>

      <div className="rounded-xl border border-border/60 bg-muted/20 p-4 sm:p-5">
        <div className="mb-3 flex items-center gap-2">
          <ReceiptText className="text-muted-foreground size-4" />
          <p className="text-sm font-medium">{t("summary.description")}</p>
        </div>
        <p className="text-sm leading-6 sm:text-[15px]">{destination ?? "-"}</p>
        {pageUrl ? (
          <a
            href={pageUrl}
            target="_blank"
            rel="noreferrer"
            className="text-primary mt-3 inline-flex items-center gap-1 text-sm underline underline-offset-4"
          >
            {t("summary.openCheckoutLink")}
            <ExternalLink className="size-3.5" />
          </a>
        ) : null}
      </div>
    </div>
  );
}

function QuickFactsSection({
  card,
  profitAmount,
  amount,
  ccy,
  t,
}: {
  card?: string;
  profitAmount?: number;
  amount?: number;
  ccy?: PaymentDetails["ccy"];
  t: (key: string) => string;
}) {
  const facts: { label: string; value: string; hint?: string }[] = [
    {
      label: t("quickFacts.amount"),
      value: formatMonobankMoney(amount, ccy),
      hint: t("hints.amount"),
    },
    typeof profitAmount === "number"
      ? {
          label: t("quickFacts.profitAmount"),
          value: formatMonobankMoney(profitAmount, ccy),
          hint: t("hints.profitAmount"),
        }
      : null,
    { label: t("quickFacts.card"), value: card ?? "-" },
  ].filter((item) => item !== null);

  return (
    <div className="rounded-xl border border-border/60 bg-background/80 p-4 shadow-xs">
      <div className="mb-3 flex items-center gap-2">
        <CreditCard className="text-muted-foreground size-4" />
        <p className="text-sm font-medium">{t("quickFacts.title")}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
        {facts.map((item) => (
          <DetailCard
            key={item.label}
            label={item.label}
            value={item.value}
            hint={item.hint}
          />
        ))}
      </div>
    </div>
  );
}

export function PaymentDetailsBody({
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
  const t = useTranslations("admin.paymentDetails");
  const displayDetails = mergePaymentDetails(summary, details);
  const paymentInfo = displayDetails?.paymentInfo;

  const pendingStatusAppearance = {
    className:
      "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/60 dark:bg-sky-500/10 dark:text-sky-300",
    icon: AlertTriangle,
    label: t("statuses.pending"),
  };

  const paymentStatusAppearances: Record<
    string,
    { className: string; icon: typeof AlertTriangle; label: string }
  > = {
    cancelled: {
      className:
        "border-border bg-muted/40 text-muted-foreground dark:bg-muted/20",
      icon: XCircle,
      label: t("statuses.cancelled"),
    },
    expired: {
      className:
        "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-500/10 dark:text-amber-300",
      icon: XCircle,
      label: t("statuses.expired"),
    },
    failed: {
      className:
        "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-500/10 dark:text-rose-300",
      icon: XCircle,
      label: t("statuses.failed"),
    },
    failure: {
      className:
        "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-500/10 dark:text-rose-300",
      icon: XCircle,
      label: t("statuses.failure"),
    },
    invoice_created: pendingStatusAppearance,
    paid: {
      className:
        "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-500/10 dark:text-emerald-300",
      icon: CheckCircle2,
      label: t("statuses.paid"),
    },
    success: {
      className:
        "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-500/10 dark:text-emerald-300",
      icon: CheckCircle2,
      label: t("statuses.success"),
    },
  };

  function getStatusAppearance(status?: string) {
    const normalizedStatus = normalizePaymentStatus(status);

    if (normalizedStatus === "processing" || normalizedStatus === "hold") {
      return {
        label: status ?? t("statuses.pending"),
        icon: AlertTriangle,
        className:
          "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-500/10 dark:text-amber-300",
      };
    }

    if (normalizedStatus === "created") return pendingStatusAppearance;

    if (normalizedStatus && normalizedStatus in paymentStatusAppearances)
      return paymentStatusAppearances[normalizedStatus];

    return {
      label: status ?? t("statuses.unknown"),
      icon: ReceiptText,
      className:
        "border-border bg-muted/40 text-muted-foreground dark:bg-muted/20",
    };
  }

  const statusAppearance = getStatusAppearance(displayDetails?.status);
  const StatusIcon = statusAppearance!.icon;
  const secondaryDetails: {
    label: string;
    value: string;
    mono?: boolean;
    hint?: string;
  }[] = [
    {
      label: details?.createdDate
        ? t("labels.created")
        : t("labels.statementDate"),
      value: formatMonobankDate(displayDetails?.createdDate),
    },
    details?.modifiedDate
      ? {
          label: t("labels.updated"),
          value: formatMonobankDate(details.modifiedDate),
        }
      : null,
    paymentInfo?.bank
      ? { label: t("labels.bank"), value: paymentInfo.bank }
      : null,
    paymentInfo?.paymentSystem
      ? { label: t("labels.paymentSystem"), value: paymentInfo.paymentSystem }
      : null,
    paymentInfo?.approvalCode
      ? { label: t("labels.approvalCode"), value: paymentInfo.approvalCode }
      : null,
    paymentInfo?.rrn
      ? { label: t("labels.rrn"), value: paymentInfo.rrn }
      : null,
    paymentInfo?.terminal
      ? { label: t("labels.terminal"), value: paymentInfo.terminal }
      : null,
    paymentInfo?.tranId
      ? {
          label: t("labels.transactionId"),
          value: paymentInfo.tranId,
          mono: true,
        }
      : null,
    typeof paymentInfo?.fee === "number"
      ? {
          label: t("labels.fee"),
          value: formatMonobankMoney(paymentInfo.fee, displayDetails?.ccy),
          hint: t("hints.fee"),
        }
      : null,
    paymentInfo?.country
      ? {
          label: t("labels.country"),
          value: formatCountryCode(paymentInfo.country),
          hint: t("hints.country"),
        }
      : null,
    displayDetails?.customerName
      ? { label: t("labels.customer"), value: displayDetails.customerName }
      : null,
    displayDetails?.expiresAt
      ? {
          label: t("labels.expires"),
          value: formatMonobankDate(displayDetails.expiresAt),
        }
      : null,
    displayDetails?.reference
      ? {
          label: t("labels.reference"),
          value: displayDetails.reference,
          mono: true,
        }
      : null,
  ].filter((item) => item !== null);

  if (isLoading && !displayDetails) {
    return (
      <p className="text-muted-foreground text-sm">{t("loadingDetails")}</p>
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
    return <p className="text-muted-foreground text-sm">{t("openPayment")}</p>;
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
                  statusAppearance!.className,
                )}
              >
                <StatusIcon className="size-3.5" />
                {statusAppearance!.label}
              </Badge>
              <Badge
                variant="outline"
                className="h-7 rounded-full px-3 text-xs"
              >
                {t("invoice", { id: displayDetails.invoiceId ?? "-" })}
              </Badge>
            </div>

            <PaymentSummarySection
              amount={displayDetails.amount}
              ccy={displayDetails.ccy}
              destination={displayDetails.destination}
              profitAmount={displayDetails.profitAmount}
              pageUrl={displayDetails.pageUrl}
              t={t}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <QuickFactsSection
              amount={displayDetails.amount}
              ccy={displayDetails.ccy}
              card={paymentInfo?.maskedPan}
              profitAmount={displayDetails.profitAmount}
              t={t}
            />
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
            hint={item.hint}
          />
        ))}
      </div>

      {(displayDetails.failureReason || displayDetails.errCode) && (
        <div className="grid gap-3 sm:grid-cols-2">
          <DetailCard
            label={t("failureReason")}
            value={stringifyDetailValue(displayDetails.failureReason)}
          />
          <DetailCard
            label={t("errorCode")}
            value={stringifyDetailValue(displayDetails.errCode)}
          />
        </div>
      )}
    </div>
  );
}
