"use client";

import { Loader2, RefreshCw, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  AdminDataTableCard,
  AdminDataTablePagination,
  AdminDataTableScroll,
  adminDataTableStyles,
} from "@/components/admin/AdminDataTableShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatMonobankDate, formatMonobankMoney } from "@/lib/monobank";
import {
  getPaymentStatusKind,
  normalizePaymentStatus,
  resolvePaymentStatus,
} from "@/lib/payments";

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

function statusVariant(status: string) {
  switch (getPaymentStatusKind(status)) {
    case "paid":
      return "default";
    case "failed":
    case "unknown":
      return "destructive";
    case "draft":
      return "outline";
    case "pending":
      return "secondary";
  }
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

  return (
    <AdminDataTableCard
      title={t("title")}
      description={t("description")}
      summaryItems={[
        {
          content: t("summary.total", { count: visibleInvoices.length }),
          id: "total",
        },
        {
          content: t("summary.visible", { count: filteredInvoices.length }),
          id: "visible",
        },
      ]}
      toolbar={
        <div className={adminDataTableStyles.toolbar}>
          <Input
            value={searchValue}
            onChange={(event) => {
              setSearchValue(event.target.value);
              setPageIndex(0);
            }}
            placeholder={t("searchPlaceholder")}
            className={adminDataTableStyles.search}
          />
          <div className={adminDataTableStyles.actionRow}>
            <Select
              value={String(pageSize)}
              onValueChange={(value) => {
                setPageSize(Number(value) as (typeof pageSizeOptions)[number]);
                setPageIndex(0);
              }}
            >
              <SelectTrigger className={adminDataTableStyles.select}>
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
            <Button
              variant="outline"
              size="sm"
              className={adminDataTableStyles.control}
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw
                className={`${adminDataTableStyles.icon} ${isLoading ? "animate-spin" : ""}`}
              />
              {t("refresh")}
            </Button>
            {hasActiveState ? (
              <Button
                variant="ghost"
                size="sm"
                className={adminDataTableStyles.control}
                onClick={resetTable}
              >
                <X className={adminDataTableStyles.icon} />
                {t("reset")}
              </Button>
            ) : null}
          </div>
        </div>
      }
    >
      {displayError && (
        <p className="m-3 rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          {displayError}
        </p>
      )}

      <AdminDataTableScroll>
        <Table className={adminDataTableStyles.table}>
          <TableHeader>
            <TableRow>
              <TableHead className={adminDataTableStyles.headerCell}>
                {t("columns.invoiceId")}
              </TableHead>
              <TableHead className={adminDataTableStyles.headerCell}>
                {t("columns.description")}
              </TableHead>
              <TableHead
                className={`${adminDataTableStyles.headerCell} text-right`}
              >
                {t("columns.amount")}
              </TableHead>
              <TableHead className={adminDataTableStyles.headerCell}>
                {t("columns.status")}
              </TableHead>
              <TableHead
                className={`hidden sm:table-cell ${adminDataTableStyles.headerCell}`}
              >
                {t("columns.date")}
              </TableHead>
              <TableHead
                className={`w-[80px] ${adminDataTableStyles.headerCell}`}
              />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && invoices.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className={adminDataTableStyles.emptyCell}
                >
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin" />
                    {t("loading")}
                  </span>
                </TableCell>
              </TableRow>
            ) : pageInvoices.length ? (
              pageInvoices.map((item) => (
                <TableRow key={item.invoiceId}>
                  <TableCell
                    className={`${adminDataTableStyles.cell} max-w-[8rem] truncate font-mono text-[11px]`}
                  >
                    {item.invoiceId}
                  </TableCell>
                  <TableCell
                    className={`${adminDataTableStyles.cell} max-w-[12rem] truncate text-muted-foreground`}
                  >
                    {item.description || "-"}
                  </TableCell>
                  <TableCell
                    className={`${adminDataTableStyles.cell} whitespace-nowrap text-right font-medium tabular-nums`}
                  >
                    {formatMonobankMoney(item.amount, item.currency)}
                  </TableCell>
                  <TableCell className={adminDataTableStyles.cell}>
                    <Badge
                      variant={statusVariant(item.status)}
                      className="h-4 max-w-full truncate rounded-md px-1.5 text-[10px] sm:h-5 sm:text-xs"
                    >
                      {labelStatus(item.status)}
                    </Badge>
                  </TableCell>
                  <TableCell
                    className={`hidden whitespace-nowrap text-muted-foreground sm:table-cell ${adminDataTableStyles.cell}`}
                  >
                    {formatMonobankDate(item.createdDate)}
                  </TableCell>
                  <TableCell className={adminDataTableStyles.cell}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => void handleCancel(item.invoiceId)}
                      disabled={cancellingId === item.invoiceId}
                      className={`${adminDataTableStyles.control} text-destructive hover:bg-destructive/10 hover:text-destructive`}
                    >
                      {cancellingId === item.invoiceId ? (
                        <Loader2
                          className={`${adminDataTableStyles.icon} animate-spin`}
                        />
                      ) : (
                        <X className={adminDataTableStyles.icon} />
                      )}
                      {t("cancel")}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className={adminDataTableStyles.emptyCell}
                >
                  {visibleInvoices.length === 0
                    ? t("empty")
                    : t("emptyFiltered")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </AdminDataTableScroll>

      <AdminDataTablePagination
        hidden={visibleInvoices.length === 0}
        label={
          <span>
            {t("pagination.rows", {
              filtered: filteredInvoices.length,
              total: visibleInvoices.length,
            })}
          </span>
        }
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
