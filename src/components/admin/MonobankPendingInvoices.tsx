"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { MonobankPaymentsDataTable } from "@/components/admin/MonobankPaymentsDataTable";
import {
  mapPendingInvoiceToStatementItem,
  type PendingInvoiceItem,
} from "@/lib/monobank";

interface PendingInvoicesResponse {
  error?: string;
  list?: PendingInvoiceItem[];
}

export function MonobankPendingInvoices() {
  const [items, setItems] = useState<PendingInvoiceItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadPendingInvoices = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/monobank/invoices/pending", {
        method: "GET",
        cache: "no-store",
      });
      const payload = (await response.json()) as PendingInvoicesResponse;

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to load pending invoices");
      }

      setItems(Array.isArray(payload.list) ? payload.list : []);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Failed to load pending invoices",
      );
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPendingInvoices();
  }, [loadPendingInvoices]);

  const rows = useMemo(
    () => items.map(mapPendingInvoiceToStatementItem),
    [items],
  );

  return (
    <div className="space-y-4">
      {error ? (
        <p className="text-destructive border-destructive/40 bg-destructive/5 rounded-2xl border px-4 py-3 text-sm">
          {error}
        </p>
      ) : null}
      <MonobankPaymentsDataTable
        data={rows}
        isLoading={isLoading}
        onRefresh={() => void loadPendingInvoices()}
        onInvoiceChanged={() => void loadPendingInvoices()}
        showStats={false}
        title="Pending invoices"
        description="Review active invoice links, inspect their current state, and cancel unpaid invoices before they expire."
      />
    </div>
  );
}
