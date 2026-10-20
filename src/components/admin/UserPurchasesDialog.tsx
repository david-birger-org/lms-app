"use client";

import { CreditCard } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";

import { DataList, type DataListColumn } from "@/components/shell/data-list";
import { EmptyState } from "@/components/shell/empty-state";
import {
  getPaymentBadgeStatus,
  StatusBadge,
} from "@/components/shell/status-badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { normalizePaymentStatus, resolvePaymentStatus } from "@/lib/payments";

interface PurchaseRecord {
  amountMinor: number;
  createdAt: string;
  currency: string;
  description: string;
  profitAmountMinor: number | null;
  id: string;
  productNameEn: string | null;
  productNameUk: string | null;
  status: string;
}

function formatPrice(priceMinor: number, currency: string, locale: string) {
  const amount = priceMinor / 100;
  return `${amount.toLocaleString(locale === "ua" ? "uk-UA" : "en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })} ${currency}`;
}

function formatDate(value: string, locale: string) {
  return new Date(value).toLocaleDateString(
    locale === "ua" ? "uk-UA" : "en-US",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  );
}

export function UserPurchasesDialog({
  email,
  isAdmin = false,
  name,
  onOpenChange,
  open,
  userId,
}: {
  email: string;
  isAdmin?: boolean;
  name: string | null;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  userId: string;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([]);
  // Which user the list belongs to, so a new user never flashes old rows.
  const [loadedUserId, setLoadedUserId] = useState<string | null>(null);
  const locale = useLocale();
  const t = useTranslations("admin.users.purchases");
  const requestIdRef = useRef(0);

  function labelStatus(status: string) {
    const canonicalStatus = resolvePaymentStatus(status);
    if (canonicalStatus) return t(`statuses.${canonicalStatus}`);

    return t("statuses.unknown", {
      status: normalizePaymentStatus(status) ?? "-",
    });
  }

  const loadPurchases = useCallback(async () => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/users/purchases?userId=${encodeURIComponent(userId)}`,
        {
          method: "GET",
          cache: "no-store",
        },
      );
      const payload = (await response.json()) as {
        error?: string;
        purchases?: PurchaseRecord[];
      };

      if (!response.ok) {
        throw new Error(payload.error ?? t("errors.load"));
      }

      if (requestIdRef.current !== requestId) return;
      setPurchases(Array.isArray(payload.purchases) ? payload.purchases : []);
    } catch (loadError) {
      if (requestIdRef.current !== requestId) return;
      setPurchases([]);
      setError(
        loadError instanceof Error ? loadError.message : t("errors.load"),
      );
    } finally {
      if (requestIdRef.current === requestId) {
        setIsLoading(false);
        setLoadedUserId(userId);
      }
    }
  }, [t, userId]);

  useEffect(() => {
    if (!open) return;
    void loadPurchases();
  }, [loadPurchases, open]);

  const columns: DataListColumn<PurchaseRecord>[] = [
    {
      id: "product",
      header: t("columns.product"),
      mobile: "title",
      className: "whitespace-normal",
      cell: (purchase) => {
        const productName =
          (locale === "ua" ? purchase.productNameUk : purchase.productNameEn) ??
          purchase.description;
        return (
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="truncate font-medium">{productName}</span>
            {purchase.description && purchase.description !== productName ? (
              <span className="truncate text-xs font-normal text-muted-foreground">
                {purchase.description}
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader className="pr-8">
          <DialogTitle>{t(isAdmin ? "titleAdmin" : "title")}</DialogTitle>
          <DialogDescription className="truncate">
            {name?.trim() ? `${name} · ${email}` : email}
          </DialogDescription>
        </DialogHeader>

        {error ? (
          <div
            role="alert"
            className="flex flex-col items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm sm:flex-row sm:items-center sm:justify-between"
          >
            <p className="text-destructive">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void loadPurchases()}
            >
              {t("retry")}
            </Button>
          </div>
        ) : isLoading || loadedUserId !== userId ? (
          <div
            role="status"
            aria-label={t(isAdmin ? "loadingAdmin" : "loading")}
            className="overflow-hidden rounded-xl border"
          >
            <div className="divide-y">
              {["a", "b", "c"].map((key) => (
                <div
                  key={key}
                  className="flex flex-col gap-2 p-4 md:h-14 md:flex-row md:items-center md:gap-6 md:py-0"
                >
                  <Skeleton className="h-4 w-2/5" />
                  <Skeleton className="h-4 w-1/4 md:ml-auto" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <DataList
            items={purchases}
            getKey={(purchase) => purchase.id}
            columns={columns}
            className="shadow-none"
            empty={
              <EmptyState
                icon={CreditCard}
                title={t(isAdmin ? "emptyAdmin" : "empty")}
              />
            }
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
