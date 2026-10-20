"use client";

import { ShoppingBag } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { DataList, type DataListColumn } from "@/components/shell/data-list";
import { EmptyState } from "@/components/shell/empty-state";
import {
  getPaymentBadgeStatus,
  StatusBadge,
} from "@/components/shell/status-badge";
import { normalizePaymentStatus, resolvePaymentStatus } from "@/lib/payments";
import type { UserPurchaseRecord } from "@/lib/server/user-purchases";

function intlLocale(locale: string) {
  return locale === "ua" ? "uk-UA" : "en-US";
}

function formatPrice(amountMinor: number, currency: string, locale: string) {
  const amount = new Intl.NumberFormat(intlLocale(locale), {
    maximumFractionDigits: 2,
  }).format(amountMinor / 100);
  return `${amount} ${currency}`;
}

function formatDate(iso: string, locale: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat(intlLocale(locale), {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function UserPurchases({
  initialPurchases,
}: {
  initialPurchases: UserPurchaseRecord[];
}) {
  const locale = useLocale();
  const t = useTranslations("purchases");

  function labelStatus(status: string) {
    const canonicalStatus = resolvePaymentStatus(status);
    if (canonicalStatus) return t(`statuses.${canonicalStatus}`);

    return t("statuses.unknown", {
      status: normalizePaymentStatus(status) ?? "-",
    });
  }

  const columns: DataListColumn<UserPurchaseRecord>[] = [
    {
      id: "product",
      header: t("columns.product"),
      mobile: "title",
      cell: (purchase) => {
        const primary =
          (locale === "ua" ? purchase.productNameUk : purchase.productNameEn) ??
          purchase.description;
        const secondary =
          locale === "ua" ? purchase.productNameEn : purchase.productNameUk;
        return (
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="truncate font-medium">{primary}</span>
            {secondary && secondary !== primary ? (
              <span className="truncate text-xs font-normal text-muted-foreground">
                {secondary}
              </span>
            ) : null}
          </div>
        );
      },
    },
    {
      id: "status",
      header: t("columns.status"),
      mobile: "trailing",
      cell: (purchase) => (
        <StatusBadge status={getPaymentBadgeStatus(purchase.status)}>
          {labelStatus(purchase.status)}
        </StatusBadge>
      ),
    },
    {
      id: "amount",
      header: t("columns.amount"),
      align: "end",
      cell: (purchase) => (
        <span className="font-numeric">
          {formatPrice(purchase.amountMinor, purchase.currency, locale)}
        </span>
      ),
    },
    {
      id: "date",
      header: t("columns.date"),
      align: "end",
      cell: (purchase) => (
        <span className="font-numeric text-muted-foreground">
          {formatDate(purchase.createdAt, locale)}
        </span>
      ),
    },
  ];

  return (
    <DataList
      items={initialPurchases}
      getKey={(purchase) => purchase.id}
      columns={columns}
      empty={
        <EmptyState
          icon={ShoppingBag}
          title={t("emptyTitle")}
          description={t("emptyDescription")}
        />
      }
    />
  );
}
