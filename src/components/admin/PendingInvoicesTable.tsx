"use client";

import { Loader2, ReceiptText, RefreshCw, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  AdminAlert,
  AdminDataTableCard,
  AdminDataTablePagination,
  AdminDataTableRowsSkeleton,
  AdminDataTableToolbar,
  adminDataTableStyles,
} from "@/components/admin/AdminDataTableShell";
import { DataList, type DataListColumn } from "@/components/shell/data-list";
import { EmptyState } from "@/components/shell/empty-state";
import {
  getPaymentBadgeStatus,
  StatusBadge,
} from "@/components/shell/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatMonobankDate, formatMonobankMoney } from "@/lib/monobank";
import { normalizePaymentStatus, resolvePaymentStatus } from "@/lib/payments";
import { cn } from "@/lib/utils";

const pageSizeOptions = [10, 20, 50, 100] as const;

interface PendingInvoice {
  amount: number;
  createdDate: string;
  currency: string;
  customerName: string;
  description: string;
  error?: string;
  expiresAt?: string;
  invoiceId: string;
  pageUrl?: string;
  reference: string;
  status: string;
}

interface PendingInvoicesResponse {
  list?: PendingInvoice[];
  error?: string;
}

function usePendingInvoices() {
  const [invoices, setInvoices] = useState<PendingInvoice[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isMountedRef = useRef(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/monobank/invoices/pending", {
        cache: "no-store",
      });
      const payload = (await response.json()) as PendingInvoicesResponse;

      if (!isMountedRef.current) return;

      if (!response.ok)
        throw new Error(payload.error ?? "Failed to load pending invoices");

      setInvoices(Array.isArray(payload.list) ? payload.list : []);
    } catch (loadError) {
      if (!isMountedRef.current) return;
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Failed to load pending invoices",
      );
    } finally {
      if (isMountedRef.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    void load();
    return () => {
      isMountedRef.current = false;
    };
  }, [load]);

  return { invoices, error, isLoading, refresh: load };
}

export function PendingInvoicesTable() {
  const t = useTranslations("admin.pendingInvoices");
  const {
    invoices,
    error: loadError,
    isLoading,
    refresh,
  } = usePendingInvoices();
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelledIds, setCancelledIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState<(typeof pageSizeOptions)[number]>(
    pageSizeOptions[0],
  );
  const [searchValue, setSearchValue] = useState("");

  const visibleInvoices = invoices.filter(
    (item) => !cancelledIds.has(item.invoiceId),
  );
  const query = searchValue.trim().toLowerCase();
  const filteredInvoices = useMemo(
    () =>
      query
        ? visibleInvoices.filter((item) =>
            [
              item.invoiceId,
              item.description,
              item.customerName,
              item.reference,
              item.status,
              formatMonobankMoney(item.amount, item.currency),
            ]
              .filter((value): value is string => typeof value === "string")
              .join(" ")
              .toLowerCase()
              .includes(query),
          )
        : visibleInvoices,
    [query, visibleInvoices],
  );
  const pageCount = Math.max(1, Math.ceil(filteredInvoices.length / pageSize));
  const currentPageIndex = Math.min(pageIndex, pageCount - 1);
  const pageInvoices = filteredInvoices.slice(
    currentPageIndex * pageSize,
    currentPageIndex * pageSize + pageSize,
  );
  const hasActiveState =
    searchValue.trim().length > 0 ||
    cancelledIds.size > 0 ||
    pageSize !== pageSizeOptions[0];

  const handleCancel = useCallback(
    async (invoiceId: string) => {
      if (!window.confirm(t("cancelConfirm"))) return;

      setCancellingId(invoiceId);
      setError(null);

      try {
        const response = await fetch("/api/monobank/invoice/remove", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ invoiceId }),
        });

        if (!response.ok) {
          const data = (await response.json()) as { error?: string };
          throw new Error(data.error ?? t("cancelFailed"));
        }

        setCancelledIds((prev) => new Set([...prev, invoiceId]));
      } catch (cancelError) {
        setError(
          cancelError instanceof Error ? cancelError.message : t("cancelError"),
        );
      } finally {
        setCancellingId(null);
      }
    },
    [t],
  );

  const handleRefresh = useCallback(() => {
    setCancelledIds(new Set());
    setPageIndex(0);
    void refresh();
  }, [refresh]);

  const displayError = error ?? loadError;

  function labelStatus(status: string) {
    const canonicalStatus = resolvePaymentStatus(status);
    if (canonicalStatus) return t(`statuses.${canonicalStatus}`);

    return t("statuses.unknown", {
      status: normalizePaymentStatus(status) ?? "-",
    });
  }

  function resetTable() {
    setSearchValue("");
    setCancelledIds(new Set());
    setPageSize(pageSizeOptions[0]);
    setPageIndex(0);
  }

  const columns: DataListColumn<PendingInvoice>[] = [
    {
      id: "description",
      header: t("columns.description"),
      mobile: "title",
      className: "max-w-xs",
      cell: (item) => (
        <span className="block truncate" title={item.description}>
          {item.description || "-"}
        </span>
      ),
    },
    {
      id: "invoiceId",
      header: t("columns.invoiceId"),
      cell: (item) => (
        <span
          className="font-numeric block max-w-40 truncate text-xs md:max-w-48"
          title={item.invoiceId}
        >
          {item.invoiceId}
        </span>
      ),
    },
    {
      id: "status",
      header: t("columns.status"),
      cell: (item) => (
        <StatusBadge status={getPaymentBadgeStatus(item.status)}>
          {labelStatus(item.status)}
        </StatusBadge>
      ),
    },
    {
      id: "date",
      header: t("columns.date"),
      cell: (item) => (
        <span className="font-numeric text-xs text-muted-foreground">
          {formatMonobankDate(item.createdDate)}
        </span>
      ),
    },
    {
      id: "amount",
      header: t("columns.amount"),
      align: "end",
      mobile: "trailing",
      cell: (item) => (
        <span className="font-numeric font-medium">
          {formatMonobankMoney(item.amount, item.currency)}
        </span>
      ),
    },
    {
      id: "actions",
      header: <span className="sr-only">{t("cancel")}</span>,
      align: "end",
      className: "w-px py-1.5",
      cell: (item) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => void handleCancel(item.invoiceId)}
          disabled={cancellingId === item.invoiceId}
          className={cn(
            adminDataTableStyles.control,
            "text-destructive hover:bg-destructive/10 hover:text-destructive",
          )}
        >
          {cancellingId === item.invoiceId ? (
            <Loader2 className="animate-spin" />
          ) : (
            <X />
          )}
          {t("cancel")}
        </Button>
      ),
    },
  ];

  return (
    <AdminDataTableCard
      toolbar={
        <AdminDataTableToolbar
          filtersLabel={t("filters")}
          search={
            <Input
              type="search"
              aria-label={t("searchPlaceholder")}
              value={searchValue}
              onChange={(event) => {
                setSearchValue(event.target.value);
                setPageIndex(0);
              }}
              placeholder={t("searchPlaceholder")}
              className={adminDataTableStyles.search}
            />
          }
          filters={
            <>
              <Select
                value={String(pageSize)}
                onValueChange={(value) => {
                  setPageSize(
                    Number(value) as (typeof pageSizeOptions)[number],
                  );
                  setPageIndex(0);
                }}
              >
                <SelectTrigger
                  aria-label={t("rows")}
                  className={cn(adminDataTableStyles.select, "max-md:w-full")}
                >
                  <span className="text-muted-foreground md:hidden">
                    {t("rows")}
                  </span>
                  <SelectValue placeholder={t("rows")} />
                </SelectTrigger>
                <SelectContent>
                  {pageSizeOptions.map((option) => (
                    <SelectItem key={option} value={String(option)}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {hasActiveState ? (
                <Button
                  variant="ghost"
                  className={adminDataTableStyles.control}
                  onClick={resetTable}
                >
                  <X />
                  {t("reset")}
                </Button>
              ) : null}
            </>
          }
          actions={
            <Button
              variant="outline"
              className={cn(
                adminDataTableStyles.control,
                "max-md:w-10 max-md:px-0",
              )}
              onClick={handleRefresh}
              disabled={isLoading}
              aria-label={t("refresh")}
            >
              <RefreshCw className={cn(isLoading && "animate-spin")} />
              <span className="max-md:sr-only">{t("refresh")}</span>
            </Button>
          }
        />
      }
    >
      {displayError ? (
        <AdminAlert className="m-3">{displayError}</AdminAlert>
      ) : null}

      {isLoading && invoices.length === 0 ? (
        <AdminDataTableRowsSkeleton />
      ) : (
        <DataList
          className="rounded-none border-0 bg-transparent shadow-none"
          items={pageInvoices}
          getKey={(item) => item.invoiceId}
          columns={columns}
          empty={
            <EmptyState
              className="rounded-none border-0"
              icon={ReceiptText}
              title={
                visibleInvoices.length === 0 ? t("empty") : t("emptyFiltered")
              }
              action={
                visibleInvoices.length > 0 ? (
                  <Button variant="outline" onClick={resetTable}>
                    {t("reset")}
                  </Button>
                ) : undefined
              }
            />
          }
        />
      )}

      <AdminDataTablePagination
        hidden={filteredInvoices.length === 0}
        label={t("pagination.rows", {
          filtered: filteredInvoices.length,
          total: visibleInvoices.length,
        })}
        previousLabel={t("pagination.previous")}
        nextLabel={t("pagination.next")}
        canPreviousPage={currentPageIndex > 0}
        canNextPage={currentPageIndex < pageCount - 1}
        onPreviousPage={() => setPageIndex((value) => Math.max(0, value - 1))}
        onNextPage={() =>
          setPageIndex((value) => Math.min(pageCount - 1, value + 1))
        }
      />
    </AdminDataTableCard>
  );
}
