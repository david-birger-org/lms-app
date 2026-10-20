"use client";

import { ExternalLink, Info } from "lucide-react";
import { useTranslations } from "next-intl";

import { AdminAlert } from "@/components/admin/AdminDataTableShell";
import type { PaymentDetails } from "@/components/admin/payment-details/types";
import { mergePaymentDetails } from "@/components/admin/payment-details/utils";
import {
  getPaymentBadgeStatus,
  StatusBadge,
} from "@/components/shell/status-badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
import { normalizePaymentStatus, resolvePaymentStatus } from "@/lib/payments";
import { cn } from "@/lib/utils";

function HintIcon({ text }: { text: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          tabIndex={-1}
          aria-label={text}
          className="inline-flex items-center text-muted-foreground transition-[color] duration-150 hover:text-foreground"
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

function DetailRow({
  hint,
  label,
  mono = false,
  value,
}: {
  hint?: string;
  label: string;
  mono?: boolean;
  value: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b py-2.5">
      <dt className="inline-flex shrink-0 items-center gap-1.5 text-muted-foreground">
        {label}
        {hint ? <HintIcon text={hint} /> : null}
      </dt>
      <dd
        className={cn(
          "min-w-0 text-right break-words",
          mono && "font-numeric text-xs break-all",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

function PaymentDetailsSkeleton({ label }: { label: string }) {
  return (
    <div className="flex flex-col gap-4">
      <span className="sr-only">{label}</span>
      <div aria-hidden className="flex flex-col gap-3 rounded-xl border p-4">
        <Skeleton className="h-6 w-24 rounded-full" />
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-4 w-full" />
      </div>
      <div aria-hidden className="grid gap-x-8 sm:grid-cols-2">
        {["a", "b", "c", "d", "e", "f"].map((key) => (
          <div key={key} className="flex justify-between gap-4 border-b py-3">
            <Skeleton className="h-3.5 w-20" />
            <Skeleton className="h-3.5 w-28" />
          </div>
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

  function getStatusLabel(status?: string) {
    const canonicalStatus = resolvePaymentStatus(status);
    if (canonicalStatus) return t(`statuses.${canonicalStatus}`);

    const rawStatus = normalizePaymentStatus(status);
    return rawStatus
      ? t("statuses.unknownWithValue", { status: rawStatus })
      : t("statuses.unknown");
  }

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
      mono: true,
    },
    details?.modifiedDate
      ? {
          label: t("labels.updated"),
          value: formatMonobankDate(details.modifiedDate),
          mono: true,
        }
      : null,
    displayDetails?.providerStatus
      ? {
          label: t("labels.providerStatus"),
          value: displayDetails.providerStatus,
          hint: t("hints.providerStatus"),
        }
      : null,
    paymentInfo?.bank
      ? { label: t("labels.bank"), value: paymentInfo.bank }
      : null,
    paymentInfo?.paymentSystem
      ? { label: t("labels.paymentSystem"), value: paymentInfo.paymentSystem }
      : null,
    paymentInfo?.approvalCode
      ? {
          label: t("labels.approvalCode"),
          value: paymentInfo.approvalCode,
          mono: true,
        }
      : null,
    paymentInfo?.rrn
      ? { label: t("labels.rrn"), value: paymentInfo.rrn, mono: true }
      : null,
    paymentInfo?.terminal
      ? { label: t("labels.terminal"), value: paymentInfo.terminal, mono: true }
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
          mono: true,
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
          mono: true,
        }
      : null,
    displayDetails?.reference
      ? {
          label: t("labels.reference"),
          value: displayDetails.reference,
          mono: true,
        }
      : null,
    paymentInfo?.maskedPan
      ? {
          label: t("quickFacts.card"),
          value: paymentInfo.maskedPan,
          mono: true,
        }
      : null,
  ].filter((item) => item !== null);

  if (isLoading && !displayDetails) {
    return <PaymentDetailsSkeleton label={t("loadingDetails")} />;
  }

  if (error) {
    return <AdminAlert>{error}</AdminAlert>;
  }

  if (!displayDetails) {
    return <p className="text-sm text-muted-foreground">{t("openPayment")}</p>;
  }

  return (
    <div className="flex flex-col gap-5 text-sm">
      {warning ? <AdminAlert tone="warning">{warning}</AdminAlert> : null}

      <section className="flex flex-col gap-4 rounded-xl border bg-background-200 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <StatusBadge status={getPaymentBadgeStatus(displayDetails.status)}>
            {getStatusLabel(displayDetails.status)}
          </StatusBadge>
          {displayDetails.pageUrl ? (
            <Button asChild variant="outline" size="sm" className="h-10 sm:h-8">
              <a href={displayDetails.pageUrl} target="_blank" rel="noreferrer">
                {t("summary.openCheckoutLink")}
                <ExternalLink data-icon="inline-end" />
              </a>
            </Button>
          ) : null}
        </div>

        <div className="flex flex-wrap items-end gap-x-8 gap-y-3">
          <div className="flex flex-col gap-1">
            <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              {t("summary.amount")}
              <HintIcon text={t("hints.amount")} />
            </p>
            <p className="font-numeric text-3xl font-semibold tracking-tight">
              {formatMonobankMoney(displayDetails.amount, displayDetails.ccy)}
            </p>
          </div>
          {typeof displayDetails.profitAmount === "number" ? (
            <div className="flex flex-col gap-1">
              <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                {t("summary.profitAmount")}
                <HintIcon text={t("hints.profitAmount")} />
              </p>
              <p className="font-numeric text-lg font-medium">
                {formatMonobankMoney(
                  displayDetails.profitAmount,
                  displayDetails.ccy,
                )}
              </p>
            </div>
          ) : null}
        </div>

        <div className="flex flex-col gap-1 border-t pt-4">
          <p className="text-xs text-muted-foreground">
            {t("summary.description")}
          </p>
          <p className="text-pretty">{displayDetails.destination ?? "-"}</p>
        </div>
      </section>

      <dl className="grid gap-x-8 sm:grid-cols-2">
        {secondaryDetails.map((item) => (
          <DetailRow
            key={item.label}
            label={item.label}
            value={item.value}
            mono={item.mono}
            hint={item.hint}
          />
        ))}
      </dl>

      {displayDetails.failureReason || displayDetails.errCode ? (
        <AdminAlert>
          <span className="font-medium">{t("failureReason")}:</span>{" "}
          {stringifyDetailValue(displayDetails.failureReason)}
          <span className="font-numeric mt-1 block text-xs">
            {t("errorCode")}: {stringifyDetailValue(displayDetails.errCode)}
          </span>
        </AdminAlert>
      ) : null}
    </div>
  );
}
