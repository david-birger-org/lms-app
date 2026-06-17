"use client";

import type { Column, ColumnDef, FilterFn } from "@tanstack/react-table";
import {
  ArrowUpDown,
  CircleAlert,
  CircleCheckBig,
  CircleX,
  Eye,
  Info,
} from "lucide-react";

import { adminDataTableStyles } from "@/components/admin/AdminDataTableShell";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  formatMonobankMoney,
  formatMonobankShortDate,
  type StatementItem,
} from "@/lib/monobank";
import { getPaymentStatusKind, normalizePaymentStatus } from "@/lib/payments";

function ColumnHint({ text }: { text: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
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

function StatusIcon({ status }: { status?: string | null }) {
  const statusKind = getPaymentStatusKind(status);
  const statusLabel = normalizePaymentStatus(status) ?? "unknown";

  if (statusKind === "paid") {
    return (
      <CircleCheckBig
        className="size-4 text-emerald-600"
        aria-label={statusLabel}
      />
    );
  }

  if (statusKind === "pending") {
    return (
      <CircleAlert className="size-4 text-amber-500" aria-label={statusLabel} />
    );
  }

  if (statusKind === "failed") {
    return (
      <CircleX className="size-4 text-rose-600" aria-label={statusLabel} />
    );
  }

  if (statusKind === "draft") {
    return (
      <CircleAlert
        className="size-4 text-muted-foreground"
        aria-label={statusLabel}
      />
    );
  }

  return (
    <CircleAlert
      className="size-4 text-muted-foreground"
      aria-label={statusLabel}
    />
  );
}

function SortableColumnHeader({
  column,
  title,
}: {
  column: Column<StatementItem>;
  title: string;
}) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className={adminDataTableStyles.sortButton}
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
    >
      {title}
      <ArrowUpDown className={adminDataTableStyles.icon} />
    </Button>
  );
}

const statusFilterFn: FilterFn<StatementItem> = (
  row,
  columnId,
  filterValue,
) => {
  if (!Array.isArray(filterValue) || filterValue.length === 0) {
    return true;
  }

  const status = row.getValue<string | undefined>(columnId);
  return typeof status === "string" ? filterValue.includes(status) : false;
};

export function createMonobankPaymentsColumns(
  t: (key: string, params?: Record<string, string>) => string,
): ColumnDef<StatementItem>[] {
  return [
    {
      id: "select",
      header: ({ table }) => {
        const isAllPageRowsSelected = table.getIsAllPageRowsSelected();
        const isSomePageRowsSelected = table.getIsSomePageRowsSelected();

        return (
          <Checkbox
            checked={
              isAllPageRowsSelected ||
              (!isAllPageRowsSelected && isSomePageRowsSelected
                ? "indeterminate"
                : false)
            }
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(value === true)
            }
            onClick={(event) => event.stopPropagation()}
            aria-label={t("selectAll")}
          />
        );
      },
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          onClick={(event) => event.stopPropagation()}
          data-row-interactive="true"
          aria-label={t("selectRow")}
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "status",
      header: t("status"),
      filterFn: statusFilterFn,
      cell: ({ row }) => {
        const statusTitle = row.original.providerStatus
          ? `App status: ${row.original.status ?? "-"} / Monobank status: ${row.original.providerStatus}`
          : `App status: ${row.original.status ?? "-"}`;

        return (
          <div className="flex justify-center" title={statusTitle}>
            <StatusIcon status={row.original.status} />
          </div>
        );
      },
    },
    {
      accessorKey: "date",
      header: ({ column }) => (
        <SortableColumnHeader column={column} title={t("date")} />
      ),
      cell: ({ row }) => {
        const value = row.original.date;

        if (!value) {
          return <div>-</div>;
        }

        return (
          <div className="whitespace-nowrap text-[11px] text-muted-foreground">
            {formatMonobankShortDate(value)}
          </div>
        );
      },
    },
    {
      accessorKey: "destination",
      header: ({ column }) => (
        <SortableColumnHeader column={column} title={t("description")} />
      ),
      cell: ({ row }) => (
        <div className="max-w-[8.5rem] truncate text-xs sm:max-w-72">
          {row.original.destination ?? "-"}
        </div>
      ),
    },
    {
      accessorKey: "maskedPan",
      header: t("card"),
      cell: ({ row }) => (
        <div className="whitespace-nowrap text-[11px] text-muted-foreground">
          {row.original.maskedPan ?? "-"}
        </div>
      ),
    },
    {
      accessorKey: "reference",
      header: ({ column }) => (
        <SortableColumnHeader column={column} title={t("reference")} />
      ),
      cell: ({ row }) => (
        <div className="max-w-[7rem] truncate font-mono text-[11px] sm:max-w-none">
          {row.original.reference?.split("-").at(-1) ?? "-"}
        </div>
      ),
    },
    {
      accessorKey: "amount",
      header: () => (
        <div className="flex items-center justify-end gap-1.5 text-right">
          {t("amount")}
          <ColumnHint text={t("amountHint")} />
        </div>
      ),
      cell: ({ row }) => (
        <div className="whitespace-nowrap text-right text-xs font-medium">
          {formatMonobankMoney(row.original.amount, row.original.ccy)}
        </div>
      ),
    },
    {
      accessorKey: "profitAmount",
      header: () => (
        <div className="flex items-center justify-end gap-1.5 text-right">
          {t("profit")}
          <ColumnHint text={t("profitHint")} />
        </div>
      ),
      cell: ({ row }) => (
        <div className="whitespace-nowrap text-right text-xs font-medium">
          {formatMonobankMoney(row.original.profitAmount, row.original.ccy)}
        </div>
      ),
    },
    {
      accessorKey: "invoiceId",
      header: ({ column }) => (
        <SortableColumnHeader column={column} title={t("invoiceId")} />
      ),
      cell: ({ row }) => (
        <div className="max-w-[7rem] truncate font-mono text-[11px] sm:max-w-none">
          {row.original.invoiceId ?? "-"}
        </div>
      ),
    },
    {
      id: "details",
      header: () => <span className="sr-only">{t("details")}</span>,
      cell: ({ row, table }) => (
        <div className="flex justify-end">
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            data-row-interactive="true"
            aria-label={t("openDetails", {
              id: row.original.invoiceId ?? row.original.reference ?? "payment",
            })}
            onClick={(event) => {
              event.stopPropagation();
              table.options.meta?.onOpenPaymentDetails?.(row.original);
            }}
          >
            <Eye />
          </Button>
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
    },
  ];
}

/** @deprecated Use createMonobankPaymentsColumns(t) instead */
export const monobankPaymentsColumns: ColumnDef<StatementItem>[] =
  createMonobankPaymentsColumns((key, params) => {
    const fallbacks: Record<string, string> = {
      selectAll: "Select all",
      selectRow: "Select row",
      status: "Status",
      date: "Date",
      description: "Description",
      card: "Card",
      reference: "Reference",
      amount: "Amount",
      amountHint:
        "Amount the customer was originally charged on the invoice, before any conversion or fees.",
      profit: "Profit",
      profitHint:
        "Net amount you actually receive after Monobank's processing fee is deducted.",
      invoiceId: "Invoice ID",
      details: "Details",
      openDetails: `Open details for ${params?.id ?? "payment"}`,
    };
    return fallbacks[key] ?? key;
  });
