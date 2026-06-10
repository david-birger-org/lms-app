"use client";
"use no memo";

import {
  type Column,
  type ColumnDef,
  type ColumnFiltersState,
  flexRender,
  type FilterFn,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  type Table as TanStackTable,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table";
import {
  ArrowUpDown,
  ChevronDown,
  ExternalLink,
  ReceiptText,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";

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
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import type { AdminRegistrationPaymentRecord } from "@/lib/server/admin-registration-payments";
import { cn } from "@/lib/utils";

const pageSizeOptions = [10, 20, 50, 100] as const;

const paidStatuses = new Set(["paid"]);
const pendingStatuses = new Set([
  "creating_invoice",
  "invoice_created",
  "processing",
]);
const failedStatuses = new Set([
  "cancelled",
  "creation_failed",
  "expired",
  "failed",
  "reversed",
]);

const defaultColumnVisibility: VisibilityState = {
  paymentId: false,
};

type RegistrationPaymentColumnMeta = {
  cellClassName?: string;
  headerClassName?: string;
  label?: string;
};

const arrayFilter: FilterFn<AdminRegistrationPaymentRecord> = (
  row,
  columnId,
  filterValue,
) => {
  if (!Array.isArray(filterValue) || filterValue.length === 0) return true;
  const value = row.getValue<unknown>(columnId);
  return typeof value === "string" ? filterValue.includes(value) : false;
};

const searchFilter: FilterFn<AdminRegistrationPaymentRecord> = (
  row,
  _columnId,
  filterValue,
) => {
  if (typeof filterValue !== "string") return true;
  const query = filterValue.trim().toLowerCase();
  if (!query) return true;

  return getSearchValue(row.original).includes(query);
};

function formatMoney(amountMinor: number, currency: string) {
  return new Intl.NumberFormat(undefined, {
    currency,
    style: "currency",
  }).format(amountMinor / 100);
}

function formatDateTime(value?: string) {
  if (!value) return "-";
  return new Date(value).toLocaleString(undefined, {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    year: "2-digit",
  });
}

function statusVariant(status: string) {
  if (paidStatuses.has(status)) return "default";
  if (failedStatuses.has(status)) return "destructive";
  return "secondary";
}

function getSearchValue(payment: AdminRegistrationPaymentRecord) {
  return [
    payment.customerName,
    payment.customerEmail,
    payment.externalRef,
    payment.paymentId,
    payment.invoiceId,
    payment.pageUrl,
    payment.checkId,
    payment.checkStatus,
    payment.checkTaxUrl,
    payment.productSlug,
    payment.source,
    payment.status,
    payment.providerStatus,
    formatMoney(payment.amountMinor, payment.currency),
    String(payment.amountMinor / 100),
  ]
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.toLowerCase())
    .join(" ");
}

function getColumnMeta(column: Column<AdminRegistrationPaymentRecord>) {
  return column.columnDef.meta as RegistrationPaymentColumnMeta | undefined;
}

function SortableColumnHeader({
  column,
  title,
  className,
}: {
  column: Column<AdminRegistrationPaymentRecord>;
  title: string;
  className?: string;
}) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn("h-7 gap-1 px-1.5 text-[11px] sm:text-xs", className)}
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
    >
      {title}
      <ArrowUpDown className="size-3" />
    </Button>
  );
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <Card className="shadow-xs">
      <CardHeader className="p-3 sm:p-4">
        <CardDescription className="text-xs">{label}</CardDescription>
        <CardTitle className="text-lg sm:text-2xl">{value}</CardTitle>
      </CardHeader>
    </Card>
  );
}

type RegistrationPaymentLabels = {
  columns: {
    amount: string;
    created: string;
    externalRef: string;
    invoice: string;
    participant: string;
    paymentId: string;
    receipt: string;
    source: string;
    status: string;
  };
  sources: Record<string, string>;
  statuses: Record<string, string>;
  unknownName: string;
};

function labelStatus(status: string, labels: RegistrationPaymentLabels) {
  return labels.statuses[status] ?? status;
}

function labelSource(source: string, labels: RegistrationPaymentLabels) {
  return labels.sources[source] ?? source;
}

function createColumns(
  labels: RegistrationPaymentLabels,
): ColumnDef<AdminRegistrationPaymentRecord>[] {
  return [
    {
      accessorKey: "customerName",
      header: ({ column }) => (
        <SortableColumnHeader
          column={column}
          title={labels.columns.participant}
        />
      ),
      cell: ({ row }) => {
        const payment = row.original;
        return (
          <div className="flex min-w-[10rem] max-w-[12rem] flex-col gap-0.5 sm:max-w-[16rem]">
            <span className="truncate text-xs font-medium sm:text-sm">
              {payment.customerName || labels.unknownName}
            </span>
            <a
              href={`mailto:${payment.customerEmail}`}
              className="truncate text-[11px] text-muted-foreground hover:underline"
            >
              {payment.customerEmail}
            </a>
            <span className="truncate font-mono text-[10px] text-muted-foreground sm:hidden">
              {payment.externalRef}
            </span>
          </div>
        );
      },
      sortingFn: (a, b) =>
        a.original.customerName.localeCompare(b.original.customerName),
      meta: {
        label: labels.columns.participant,
      },
    },
    {
      accessorKey: "amountMinor",
      header: ({ column }) => (
        <SortableColumnHeader
          column={column}
          title={labels.columns.amount}
          className="ml-auto"
        />
      ),
      cell: ({ row }) => (
        <div className="whitespace-nowrap text-right text-xs font-medium sm:text-sm">
          {formatMoney(row.original.amountMinor, row.original.currency)}
        </div>
      ),
      meta: {
        cellClassName: "text-right",
        headerClassName: "text-right",
        label: labels.columns.amount,
      },
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <SortableColumnHeader column={column} title={labels.columns.status} />
      ),
      filterFn: arrayFilter,
      cell: ({ row }) => (
        <div className="flex max-w-[7.75rem] flex-col gap-0.5">
          <Badge
            variant={statusVariant(row.original.status)}
            className="h-4 max-w-full truncate rounded-md px-1.5 text-[10px] sm:h-5 sm:text-xs"
          >
            {labelStatus(row.original.status, labels)}
          </Badge>
          {row.original.failureReason ? (
            <span className="truncate text-[10px] text-destructive">
              {row.original.failureReason}
            </span>
          ) : row.original.providerStatus ? (
            <span className="truncate text-[10px] text-muted-foreground">
              {row.original.providerStatus}
            </span>
          ) : null}
        </div>
      ),
      meta: {
        label: labels.columns.status,
      },
    },
    {
      accessorKey: "invoiceId",
      header: ({ column }) => (
        <SortableColumnHeader column={column} title={labels.columns.invoice} />
      ),
      cell: ({ row }) =>
        row.original.pageUrl ? (
          <a
            href={row.original.pageUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex max-w-[5.5rem] items-center gap-1 truncate text-[11px] text-primary hover:underline sm:max-w-[10rem] sm:text-xs"
          >
            <ExternalLink className="size-3 shrink-0" />
            <span className="truncate">
              {row.original.invoiceId ?? row.original.pageUrl}
            </span>
          </a>
        ) : (
          <span className="text-muted-foreground">-</span>
        ),
      meta: {
        label: labels.columns.invoice,
      },
    },
    {
      accessorKey: "checkStatus",
      header: ({ column }) => (
        <SortableColumnHeader column={column} title={labels.columns.receipt} />
      ),
      cell: ({ row }) => {
        const checkHref = row.original.checkTaxUrl ?? row.original.checkFile;
        if (checkHref) {
          return (
            <a
              href={checkHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex max-w-[5rem] items-center gap-1 truncate text-[11px] text-primary hover:underline sm:max-w-[9rem] sm:text-xs"
            >
              <ReceiptText className="size-3 shrink-0" />
              <span className="truncate">
                {row.original.checkStatus ?? row.original.checkId}
              </span>
            </a>
          );
        }
        if (row.original.checkStatus) {
          return (
            <Badge variant="outline" className="h-4 px-1.5 text-[10px]">
              {row.original.checkStatus}
            </Badge>
          );
        }
        return <span className="text-muted-foreground">-</span>;
      },
      meta: {
        label: labels.columns.receipt,
      },
    },
    {
      accessorKey: "source",
      header: ({ column }) => (
        <SortableColumnHeader column={column} title={labels.columns.source} />
      ),
      filterFn: arrayFilter,
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className="h-4 rounded-md px-1.5 text-[10px] sm:h-5 sm:text-xs"
        >
          {labelSource(row.original.source, labels)}
        </Badge>
      ),
      meta: {
        cellClassName: "hidden sm:table-cell",
        headerClassName: "hidden sm:table-cell",
        label: labels.columns.source,
      },
    },
    {
      accessorKey: "externalRef",
      header: ({ column }) => (
        <SortableColumnHeader
          column={column}
          title={labels.columns.externalRef}
        />
      ),
      cell: ({ row }) => (
        <div className="max-w-[11rem] truncate font-mono text-[11px]">
          {row.original.externalRef}
        </div>
      ),
      meta: {
        cellClassName: "hidden md:table-cell",
        headerClassName: "hidden md:table-cell",
        label: labels.columns.externalRef,
      },
    },
    {
      accessorKey: "paymentCreatedAt",
      header: ({ column }) => (
        <SortableColumnHeader column={column} title={labels.columns.created} />
      ),
      cell: ({ row }) => (
        <div className="whitespace-nowrap text-[11px] text-muted-foreground">
          {formatDateTime(row.original.paymentCreatedAt)}
        </div>
      ),
      sortingFn: (a, b) =>
        new Date(a.original.paymentCreatedAt).getTime() -
        new Date(b.original.paymentCreatedAt).getTime(),
      meta: {
        cellClassName: "hidden lg:table-cell",
        headerClassName: "hidden lg:table-cell",
        label: labels.columns.created,
      },
    },
    {
      accessorKey: "paymentId",
      header: labels.columns.paymentId,
      cell: ({ row }) => (
        <div className="max-w-[12rem] truncate font-mono text-[11px]">
          {row.original.paymentId}
        </div>
      ),
      meta: {
        label: labels.columns.paymentId,
      },
    },
  ];
}

export function RegistrationPaymentsTable({
  payments,
}: {
  payments: AdminRegistrationPaymentRecord[];
}) {
  const t = useTranslations("admin.registrationPayments");
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "paymentCreatedAt", desc: true },
  ]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [searchValue, setSearchValue] = React.useState("");
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>(defaultColumnVisibility);

  const labels = React.useMemo<RegistrationPaymentLabels>(
    () => ({
      columns: {
        amount: t("columns.amount"),
        created: t("columns.created"),
        externalRef: t("columns.externalRef"),
        invoice: t("columns.invoice"),
        participant: t("columns.participant"),
        paymentId: t("columns.paymentId"),
        receipt: t("columns.receipt"),
        source: t("columns.source"),
        status: t("columns.status"),
      },
      sources: {
        wnbf: t("sources.wnbf"),
        "wnbf-test": t("sources.wnbf-test"),
      },
      statuses: {
        cancelled: t("statuses.cancelled"),
        creating_invoice: t("statuses.creating_invoice"),
        creation_failed: t("statuses.creation_failed"),
        draft: t("statuses.draft"),
        expired: t("statuses.expired"),
        failed: t("statuses.failed"),
        invoice_created: t("statuses.invoice_created"),
        paid: t("statuses.paid"),
        processing: t("statuses.processing"),
        reversed: t("statuses.reversed"),
      },
      unknownName: t("unknownName"),
    }),
    [t],
  );

  const columns = React.useMemo(() => createColumns(labels), [labels]);
  const table = useReactTable({
    data: payments,
    columns,
    globalFilterFn: searchFilter,
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: 20,
      },
    },
    state: {
      columnFilters,
      columnVisibility,
      globalFilter: searchValue,
      sorting,
    },
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setSearchValue,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const statusOptions = React.useMemo(
    () => [...new Set(payments.map((payment) => payment.status))].sort(),
    [payments],
  );
  const sourceOptions = React.useMemo(
    () => [...new Set(payments.map((payment) => payment.source))].sort(),
    [payments],
  );
  const selectedStatuses = getArrayFilter(columnFilters, "status");
  const selectedSources = getArrayFilter(columnFilters, "source");
  const paidCount = payments.filter((payment) =>
    paidStatuses.has(payment.status),
  ).length;
  const pendingCount = payments.filter((payment) =>
    pendingStatuses.has(payment.status),
  ).length;
  const totalAmount = payments
    .filter((payment) => paidStatuses.has(payment.status))
    .reduce((sum, payment) => sum + payment.amountMinor, 0);
  const hasDefaultSort =
    sorting.length === 1 &&
    sorting[0]?.id === "paymentCreatedAt" &&
    sorting[0]?.desc === true;
  const hasActiveState =
    searchValue.trim().length > 0 ||
    selectedStatuses.length > 0 ||
    selectedSources.length > 0 ||
    !hasDefaultSort ||
    table
      .getAllLeafColumns()
      .some(
        (column) =>
          column.getCanHide() &&
          column.getIsVisible() !==
            (defaultColumnVisibility[column.id] ?? true),
      );

  function handleArrayFilterToggle(
    columnId: string,
    value: string,
    checked: boolean,
  ) {
    table.getColumn(columnId)?.setFilterValue((currentValue: unknown) => {
      const current = Array.isArray(currentValue)
        ? currentValue.filter(
            (item): item is string => typeof item === "string",
          )
        : [];
      const next = checked
        ? [...new Set([...current, value])]
        : current.filter((item) => item !== value);
      return next.length > 0 ? next : undefined;
    });
  }

  function resetTable() {
    setSearchValue("");
    setColumnFilters([]);
    setSorting([{ id: "paymentCreatedAt", desc: true }]);
    setColumnVisibility(defaultColumnVisibility);
    table.setPageIndex(0);
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <StatCard label={t("stats.total")} value={payments.length} />
        <StatCard label={t("stats.paid")} value={paidCount} />
        <StatCard
          label={t("stats.paidAmount")}
          value={formatMoney(totalAmount, "UAH")}
        />
      </div>
      <Card className="shadow-xs">
        <CardHeader className="border-b px-3 py-3 sm:px-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-1">
              <CardTitle>{t("title")}</CardTitle>
              <CardDescription>
                {t("description", { pending: pendingCount })}
              </CardDescription>
            </div>
            <div className="flex flex-col gap-2 md:flex-row lg:justify-end">
              <Input
                value={searchValue}
                onChange={(event) => {
                  setSearchValue(event.target.value);
                  table.setPageIndex(0);
                }}
                placeholder={t("toolbar.searchPlaceholder")}
                className="h-8 text-xs md:w-64"
              />
              <div className="flex flex-wrap gap-1.5">
                <FilterMenu
                  label={t("toolbar.status")}
                  menuLabel={t("toolbar.filterStatus")}
                  options={statusOptions}
                  selectedOptions={selectedStatuses}
                  getOptionLabel={(status) => labelStatus(status, labels)}
                  onToggle={(status, checked) =>
                    handleArrayFilterToggle("status", status, checked)
                  }
                />
                <FilterMenu
                  label={t("toolbar.source")}
                  menuLabel={t("toolbar.filterSource")}
                  options={sourceOptions}
                  selectedOptions={selectedSources}
                  getOptionLabel={(source) => labelSource(source, labels)}
                  onToggle={(source, checked) =>
                    handleArrayFilterToggle("source", source, checked)
                  }
                />
                <ColumnsMenu table={table} label={t("toolbar.columns")} />
                <Select
                  value={String(table.getState().pagination.pageSize)}
                  onValueChange={(value) => {
                    table.setPageSize(Number(value));
                    table.setPageIndex(0);
                  }}
                >
                  <SelectTrigger className="h-8 w-16 text-xs">
                    <SelectValue placeholder={t("toolbar.rows")} />
                  </SelectTrigger>
                  <SelectContent>
                    {pageSizeOptions.map((pageSize) => (
                      <SelectItem key={pageSize} value={String(pageSize)}>
                        {pageSize}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {hasActiveState ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-xs"
                    onClick={resetTable}
                  >
                    <X className="size-3" />
                    {t("toolbar.reset")}
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="text-[11px] sm:text-xs">
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      const meta = getColumnMeta(header.column);
                      return (
                        <TableHead
                          key={header.id}
                          className={cn(
                            "h-7 px-1.5 py-1 sm:px-2",
                            meta?.headerClassName,
                          )}
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext(),
                              )}
                        </TableHead>
                      );
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id}>
                      {row.getVisibleCells().map((cell) => {
                        const meta = getColumnMeta(cell.column);
                        return (
                          <TableCell
                            key={cell.id}
                            className={cn(
                              "px-1.5 py-1.5 align-top sm:px-2",
                              meta?.cellClassName,
                            )}
                          >
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext(),
                            )}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={table.getVisibleLeafColumns().length}
                      className="h-24 text-center text-sm text-muted-foreground"
                    >
                      {payments.length === 0 ? t("empty") : t("emptyFiltered")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          {payments.length > 0 ? (
            <div className="flex items-center justify-between gap-3 border-t px-3 py-2 text-xs text-muted-foreground">
              <span>
                {t("pagination.rows", {
                  filtered: table.getFilteredRowModel().rows.length,
                  total: payments.length,
                })}
              </span>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-2 text-xs"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  {t("pagination.previous")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-2 text-xs"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                >
                  {t("pagination.next")}
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

function getArrayFilter(columnFilters: ColumnFiltersState, columnId: string) {
  const value = columnFilters.find((filter) => filter.id === columnId)?.value;
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function FilterMenu({
  getOptionLabel,
  label,
  menuLabel,
  onToggle,
  options,
  selectedOptions,
}: {
  getOptionLabel: (value: string) => string;
  label: string;
  menuLabel: string;
  onToggle: (value: string, checked: boolean) => void;
  options: string[];
  selectedOptions: string[];
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 px-2 text-xs">
          {label}
          <ChevronDown className="size-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuGroup>
          <DropdownMenuLabel>{menuLabel}</DropdownMenuLabel>
          {options.map((option) => (
            <DropdownMenuCheckboxItem
              key={option}
              checked={selectedOptions.includes(option)}
              onCheckedChange={(value) => onToggle(option, Boolean(value))}
            >
              {getOptionLabel(option)}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ColumnsMenu({
  label,
  table,
}: {
  label: string;
  table: TanStackTable<AdminRegistrationPaymentRecord>;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 px-2 text-xs">
          {label}
          <ChevronDown className="size-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuGroup>
          {table
            .getAllColumns()
            .filter((column) => column.getCanHide())
            .map((column) => {
              const meta = getColumnMeta(column);
              return (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  checked={column.getIsVisible()}
                  onCheckedChange={(value) =>
                    column.toggleVisibility(Boolean(value))
                  }
                >
                  {meta?.label ?? column.id}
                </DropdownMenuCheckboxItem>
              );
            })}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
