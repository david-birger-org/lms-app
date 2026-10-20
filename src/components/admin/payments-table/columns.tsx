"use client";

import type { Column, ColumnDef, FilterFn } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown, Eye, Info } from "lucide-react";

import { adminDataTableStyles } from "@/components/admin/AdminDataTableShell";
import {
  getPaymentBadgeStatus,
  StatusBadge,
} from "@/components/shell/status-badge";
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
import { cn } from "@/lib/utils";

function ColumnHint({ text }: { text: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
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

export function SortableColumnHeader<T>({
  className,
  column,
  title,
}: {
  className?: string;
  column: Column<T>;
  title: string;
}) {
  const sorted = column.getIsSorted();
  const SortIcon =
    sorted === "asc" ? ArrowUp : sorted === "desc" ? ArrowDown : ArrowUpDown;

  return (
    <Button
      variant="ghost"
      size="sm"
      static
      className={cn(
        "-mx-2.5 h-8 text-xs font-medium text-muted-foreground hover:text-foreground",
        sorted && "text-foreground",
        className,
      )}
      onClick={() => column.toggleSorting(sorted === "asc")}
    >
      {title}
      <SortIcon className={cn("size-3", !sorted && "opacity-50")} />
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
  getStatusLabel: (status: string) => string,
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
          className="mt-0.5 md:mt-0"
        />
      ),
      enableSorting: false,
      enableHiding: false,
      meta: { headerClassName: "w-10", mobile: "title" },
    },
    {
      accessorKey: "status",
      header: t("status"),
      filterFn: statusFilterFn,
      cell: ({ row }) => {
        const status = row.original.status;
        const statusTitle = row.original.providerStatus
          ? `App status: ${status ?? "-"} / Monobank status: ${row.original.providerStatus}`
          : `App status: ${status ?? "-"}`;

        return (
          <span title={statusTitle}>
            <StatusBadge status={getPaymentBadgeStatus(status)}>
              {status ? getStatusLabel(status) : "-"}
            </StatusBadge>
          </span>
        );
      },
      meta: { label: t("status") },
    },
    {
      accessorKey: "date",
      header: ({ column }) => (
        <SortableColumnHeader column={column} title={t("date")} />
      ),
      cell: ({ row }) => (
        <span className="font-numeric text-xs text-muted-foreground">
          {row.original.date ? formatMonobankShortDate(row.original.date) : "-"}
        </span>
      ),
      meta: { label: t("date") },
    },
    {
      accessorKey: "destination",
      header: ({ column }) => (
        <SortableColumnHeader column={column} title={t("description")} />
      ),
      cell: ({ row }) => (
        <div
          className="line-clamp-2 whitespace-normal md:block md:max-w-72 md:truncate"
          title={row.original.destination}
        >
          {row.original.destination ?? "-"}
        </div>
      ),
      meta: { label: t("description"), mobile: "title" },
    },
    {
      accessorKey: "maskedPan",
      header: t("card"),
      cell: ({ row }) => (
        <span className="font-numeric text-xs text-muted-foreground">
          {row.original.maskedPan ?? "-"}
        </span>
      ),
      meta: { label: t("card") },
    },
    {
      accessorKey: "reference",
      header: ({ column }) => (
        <SortableColumnHeader column={column} title={t("reference")} />
      ),
      cell: ({ row }) => (
        <span
          className="font-numeric block max-w-40 truncate text-xs"
          title={row.original.reference}
        >
          {row.original.reference?.split("-").at(-1) ?? "-"}
        </span>
      ),
      meta: { label: t("reference") },
    },
    {
      accessorKey: "amount",
      header: () => (
        <div className="inline-flex items-center gap-1.5">
          {t("amount")}
          <ColumnHint text={t("amountHint")} />
        </div>
      ),
      cell: ({ row }) => (
        <span className="font-numeric text-sm font-medium">
          {formatMonobankMoney(row.original.amount, row.original.ccy)}
        </span>
      ),
      meta: { align: "end", label: t("amount"), mobile: "trailing" },
    },
    {
      accessorKey: "profitAmount",
      header: () => (
        <div className="inline-flex items-center gap-1.5">
          {t("profit")}
          <ColumnHint text={t("profitHint")} />
        </div>
      ),
      cell: ({ row }) => (
        <span className="font-numeric text-sm">
          {formatMonobankMoney(row.original.profitAmount, row.original.ccy)}
        </span>
      ),
      meta: { align: "end", label: t("profit") },
    },
    {
      accessorKey: "invoiceId",
      header: ({ column }) => (
        <SortableColumnHeader column={column} title={t("invoiceId")} />
      ),
      cell: ({ row }) => (
        <span
          className="font-numeric block max-w-40 truncate text-xs"
          title={row.original.invoiceId}
        >
          {row.original.invoiceId ?? "-"}
        </span>
      ),
      meta: { label: t("invoiceId") },
    },
    {
      id: "details",
      header: () => <span className="sr-only">{t("details")}</span>,
      cell: ({ row, table }) => (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className={adminDataTableStyles.iconControl}
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
      ),
      enableSorting: false,
      enableHiding: false,
      meta: {
        align: "end",
        cellClassName: "w-12 py-1.5",
        label: t("details"),
        mobile: "trailing",
      },
    },
  ];
}
