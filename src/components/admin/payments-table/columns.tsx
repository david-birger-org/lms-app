"use client";

import type { Column, ColumnDef, FilterFn } from "@tanstack/react-table";
import {
  ArrowUpDown,
  CircleAlert,
  CircleCheckBig,
  CircleX,
  Eye,
} from "lucide-react";

import { Info } from "lucide-react";

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
import {
  isFailedPaymentStatus,
  isSuccessfulPaymentStatus,
  normalizePaymentStatus,
} from "@/lib/payments";

function StatusIcon({ status }: { status?: string | null }) {
  const normalizedStatus = normalizePaymentStatus(status);

  if (isSuccessfulPaymentStatus(status)) {
    return (
      <CircleCheckBig
        className="size-4 text-emerald-600"
        aria-label={status ?? "Paid"}
      />
    );
  }

  if (normalizedStatus === "processing" || normalizedStatus === "hold") {
    return (
      <CircleAlert
        className="size-4 text-amber-500"
        aria-label={status ?? undefined}
      />
    );
  }

  if (isFailedPaymentStatus(status)) {
    return (
      <CircleX
        className="size-4 text-rose-600"
        aria-label={status ?? "Failed"}
      />
    );
  }

  if (
    normalizedStatus === "invoice_created" ||
    normalizedStatus === "created"
  ) {
    return (
      <CircleAlert
        className="size-4 text-sky-600"
        aria-label={status ?? undefined}
      />
    );
  }

  if (normalizedStatus === "cancelled") {
    return (
      <CircleX
        className="size-4 text-muted-foreground"
        aria-label="Cancelled"
      />
    );
  }

  return <div className="text-xs text-muted-foreground">-</div>;
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
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
    >
      {title}
      <ArrowUpDown />
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

export const monobankPaymentsColumns: ColumnDef<StatementItem>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        onClick={(event) => event.stopPropagation()}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        onClick={(event) => event.stopPropagation()}
        data-row-interactive="true"
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "status",
    header: "Status",
    filterFn: statusFilterFn,
    cell: ({ row }) => (
      <div className="flex justify-center" title={row.original.status ?? "-"}>
        <StatusIcon status={row.original.status} />
      </div>
    ),
  },
  {
    accessorKey: "date",
    header: ({ column }) => (
      <SortableColumnHeader column={column} title="Date" />
    ),
    cell: ({ row }) => {
      const value = row.original.date;

      if (!value) {
        return <div>-</div>;
      }

      return (
        <div className="text-xs sm:text-sm">
          {formatMonobankShortDate(value)}
        </div>
      );
    },
  },
  {
    accessorKey: "destination",
    header: ({ column }) => (
      <SortableColumnHeader column={column} title="Description" />
    ),
    cell: ({ row }) => (
      <div className="max-w-[8.5rem] truncate text-xs sm:max-w-72 sm:text-sm">
        {row.original.destination ?? "-"}
      </div>
    ),
  },
  {
    accessorKey: "maskedPan",
    header: "Card",
    cell: ({ row }) => (
      <div className="text-xs sm:text-sm">{row.original.maskedPan ?? "-"}</div>
    ),
  },
  {
    accessorKey: "reference",
    header: ({ column }) => (
      <SortableColumnHeader column={column} title="Reference" />
    ),
    cell: ({ row }) => (
      <div className="max-w-[7rem] truncate font-mono text-[11px] sm:max-w-none sm:text-xs">
        {row.original.reference?.split("-").at(-1) ?? "-"}
      </div>
    ),
  },
  {
    accessorKey: "amount",
    header: () => (
      <div className="flex items-center justify-end gap-1.5 text-right">
        Amount
        <ColumnHint text="Amount the customer was originally charged on the invoice, before any conversion or fees." />
      </div>
    ),
    cell: ({ row }) => (
      <div className="text-right text-xs font-medium sm:text-sm">
        {formatMonobankMoney(row.original.amount, row.original.ccy)}
      </div>
    ),
  },
  {
    accessorKey: "profitAmount",
    header: () => (
      <div className="flex items-center justify-end gap-1.5 text-right">
        Profit
        <ColumnHint text="Net amount you actually receive after Monobank's processing fee is deducted." />
      </div>
    ),
    cell: ({ row }) => (
      <div className="text-right text-xs font-medium sm:text-sm">
        {formatMonobankMoney(row.original.profitAmount, row.original.ccy)}
      </div>
    ),
  },
  {
    accessorKey: "invoiceId",
    header: ({ column }) => (
      <SortableColumnHeader column={column} title="Invoice ID" />
    ),
    cell: ({ row }) => (
      <div className="max-w-[7rem] truncate font-mono text-[11px] sm:max-w-none sm:text-xs">
        {row.original.invoiceId ?? "-"}
      </div>
    ),
  },
  {
    id: "details",
    header: () => <span className="sr-only">Details</span>,
    cell: ({ row, table }) => (
      <div className="flex justify-end">
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          data-row-interactive="true"
          aria-label={`Open details for ${row.original.invoiceId ?? row.original.reference ?? "payment"}`}
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
