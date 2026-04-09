"use client";

import { Loader2, RefreshCw, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatMonobankDate, formatMonobankMoney } from "@/lib/monobank";

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

  const visibleInvoices = invoices.filter(
    (item) => !cancelledIds.has(item.invoiceId),
  );

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
    void refresh();
  }, [refresh]);

  const displayError = error ?? loadError;

  return (
    <Card className="shadow-xs">
      <CardHeader className="border-b px-3 sm:px-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle>{t("title")}</CardTitle>
            <CardDescription>{t("description")}</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw
              className={`size-4 ${isLoading ? "animate-spin" : ""}`}
            />
            {t("refresh")}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-3 pb-3 pt-4 sm:px-6 sm:pb-6">
        {displayError && (
          <p className="mb-4 rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {displayError}
          </p>
        )}

        {isLoading && invoices.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
            <Loader2 className="mr-2 size-4 animate-spin" />
            {t("loading")}
          </div>
        ) : visibleInvoices.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            {t("empty")}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("columns.invoiceId")}</TableHead>
                  <TableHead>{t("columns.description")}</TableHead>
                  <TableHead className="text-right">
                    {t("columns.amount")}
                  </TableHead>
                  <TableHead>{t("columns.status")}</TableHead>
                  <TableHead className="hidden sm:table-cell">
                    {t("columns.date")}
                  </TableHead>
                  <TableHead className="w-[80px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleInvoices.map((item) => (
                  <TableRow key={item.invoiceId}>
                    <TableCell className="max-w-[160px] truncate font-mono text-xs">
                      {item.invoiceId}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-muted-foreground">
                      {item.description || "-"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatMonobankMoney(item.amount, item.currency)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.status}</Badge>
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground sm:table-cell">
                      {formatMonobankDate(item.createdDate)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => void handleCancel(item.invoiceId)}
                        disabled={cancellingId === item.invoiceId}
                        className="h-7 px-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      >
                        {cancellingId === item.invoiceId ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <X className="size-3.5" />
                        )}
                        {t("cancel")}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
