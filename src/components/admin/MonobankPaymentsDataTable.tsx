"use client";

import {
  type ColumnFiltersState,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type RowSelectionState,
  type SortingState,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table";
import * as React from "react";

import { MonobankPaymentDetailsPopover } from "@/components/admin/MonobankPaymentDetailsPopover";
import { monobankPaymentsColumns } from "@/components/admin/payments-table/columns";
import { MonobankPaymentsTablePagination } from "@/components/admin/payments-table/pagination";
import { MonobankPaymentsTableStats } from "@/components/admin/payments-table/stats";
import { MonobankPaymentsTableContent } from "@/components/admin/payments-table/table-content";
import { MonobankPaymentsTableToolbar } from "@/components/admin/payments-table/toolbar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { StatementItem } from "@/lib/monobank";
import {
  isSuccessfulPaymentStatus,
  type PaymentDetailsSource,
} from "@/lib/payments";

const defaultColumnVisibility: VisibilityState = {
  search: false,
  profitAmount: false,
  invoiceId: false,
};

function getPaymentRowId(payment: StatementItem, index: number) {
  return (
    payment.invoiceId ??
    payment.reference ??
    `${payment.date ?? "unknown-date"}-${payment.amount ?? 0}-${index}`
  );
}

export function MonobankPaymentsDataTable({
  data,
  emptyMessage,
  isLoading,
  onRefresh,
  onInvoiceChanged,
  showStats = true,
  title = "Payments history",
  description = "Search the statement feed, filter rows, and inspect invoice-level payment details.",
  detailsSource = "database",
}: {
  data: StatementItem[];
  emptyMessage?: string;
  isLoading: boolean;
  onRefresh: () => void;
  onInvoiceChanged?: () => void;
  showStats?: boolean;
  title?: string;
  description?: string;
  detailsSource?: PaymentDetailsSource;
}) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>(defaultColumnVisibility);
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [activePayment, setActivePayment] =
    React.useState<StatementItem | null>(null);
  const [detailsOpen, setDetailsOpen] = React.useState(false);

  const handleOpenPaymentDetails = React.useCallback(
    (payment: StatementItem) => {
      setActivePayment(payment);
      setDetailsOpen(true);
    },
    [],
  );

  const pageResetKey = React.useMemo(
    () =>
      [
        String(data.length),
        ...sorting.map(({ id, desc }) => `${id}:${desc ? "desc" : "asc"}`),
        ...columnFilters.map(({ id, value }) => `${id}:${String(value)}`),
      ].join("|"),
    [columnFilters, data.length, sorting],
  );

  const table = useReactTable({
    data,
    columns: monobankPaymentsColumns,
    autoResetPageIndex: false,
    enableRowSelection: true,
    getRowId: getPaymentRowId,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  React.useEffect(() => {
    if (pageResetKey && table.getState().pagination.pageIndex === 0) {
      return;
    }

    table.setPageIndex(0);
  }, [pageResetKey, table]);

  const statusOptions = React.useMemo(
    () =>
      [
        ...new Set(data.map((item) => item.status).filter(Boolean)),
      ].sort() as string[],
    [data],
  );

  const selectedStatuses = React.useMemo(() => {
    const value = columnFilters.find((filter) => filter.id === "status")?.value;

    return Array.isArray(value)
      ? value.filter((item): item is string => typeof item === "string")
      : [];
  }, [columnFilters]);

  const searchValue =
    (table.getColumn("search")?.getFilterValue() as string | undefined) ?? "";
  const selectedRowCount = table.getFilteredSelectedRowModel().rows.length;
  const filteredRowCount = table.getFilteredRowModel().rows.length;
  const hasCustomColumnVisibility = Object.entries(columnVisibility).some(
    ([columnId, isVisible]) => defaultColumnVisibility[columnId] !== isVisible,
  );

  const hasActiveState =
    selectedStatuses.length > 0 ||
    searchValue.length > 0 ||
    sorting.length > 0 ||
    selectedRowCount > 0 ||
    hasCustomColumnVisibility;

  const selectedPaymentIdentifiers = table
    .getFilteredSelectedRowModel()
    .rows.map((row) => row.original.invoiceId ?? row.original.reference)
    .filter((value): value is string => Boolean(value));

  const successfulCount = React.useMemo(
    () => data.filter((item) => isSuccessfulPaymentStatus(item.status)).length,
    [data],
  );

  const handleStatusToggle = React.useCallback(
    (status: string, checked: boolean) => {
      setColumnFilters((current) => {
        const otherFilters = current.filter((filter) => filter.id !== "status");
        const currentStatuses = current.find(
          (filter) => filter.id === "status",
        )?.value;
        const nextStatuses = Array.isArray(currentStatuses)
          ? currentStatuses.filter(
              (item): item is string => typeof item === "string",
            )
          : [];
        const updatedStatuses = checked
          ? [...new Set([...nextStatuses, status])]
          : nextStatuses.filter((item) => item !== status);

        return updatedStatuses.length > 0
          ? [...otherFilters, { id: "status", value: updatedStatuses }]
          : otherFilters;
      });
    },
    [],
  );

  const resetTable = React.useCallback(() => {
    setSorting([]);
    setColumnFilters([]);
    setRowSelection({});
    setColumnVisibility(defaultColumnVisibility);
    table.getColumn("search")?.setFilterValue("");
  }, [table]);

  const resolvedEmptyMessage = React.useMemo(() => {
    if (isLoading && data.length === 0) {
      return "Loading results...";
    }

    if (hasActiveState && filteredRowCount === 0) {
      return "No visible results. Reset filters or clear the search to see every row.";
    }

    return emptyMessage ?? "No results.";
  }, [data.length, emptyMessage, filteredRowCount, hasActiveState, isLoading]);

  const emptyActionLabel =
    hasActiveState && filteredRowCount === 0 ? "Reset table" : undefined;

  return (
    <Card className="shadow-xs">
      <CardHeader className="border-b px-3 sm:px-6">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="px-3 pb-3 pt-4 sm:px-6 sm:pb-6">
        <div className="w-full">
          <MonobankPaymentsTableToolbar
            table={table}
            isLoading={isLoading}
            onRefresh={onRefresh}
            selectedStatuses={selectedStatuses}
            statusOptions={statusOptions}
            selectedPaymentIdentifiers={selectedPaymentIdentifiers}
            hasActiveState={hasActiveState}
            onStatusToggle={handleStatusToggle}
            onReset={resetTable}
            onClearSelection={() => setRowSelection({})}
          />

          {showStats ? (
            <MonobankPaymentsTableStats
              totalCount={data.length}
              successfulCount={successfulCount}
            />
          ) : null}

          <MonobankPaymentsTableContent
            table={table}
            onRowOpen={handleOpenPaymentDetails}
            emptyActionLabel={emptyActionLabel}
            emptyMessage={resolvedEmptyMessage}
            onEmptyAction={emptyActionLabel ? resetTable : undefined}
          />

          <MonobankPaymentDetailsPopover
            invoiceId={activePayment?.invoiceId}
            payment={activePayment ?? undefined}
            detailsSource={detailsSource}
            open={detailsOpen}
            onOpenChange={setDetailsOpen}
            onInvoiceChanged={onInvoiceChanged}
            hideTrigger
          />

          <MonobankPaymentsTablePagination table={table} />
        </div>
      </CardContent>
    </Card>
  );
}
