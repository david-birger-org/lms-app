"use client";

import type { Column, ColumnDef, FilterFn } from "@tanstack/react-table";
import {
  ArrowUpDown,
  CircleAlert,
  CircleCheckBig,
  CircleX,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  formatMonobankMoney,
  formatMonobankShortDate,
  type StatementItem,
} from "@/lib/monobank";
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

const searchFilterFn: FilterFn<StatementItem> = (
  row,
  columnId,
  filterValue,
) => {
  const query =
    typeof filterValue === "string" ? filterValue.trim().toLowerCase() : "";

  if (!query) {
    return true;
  }

  const searchValue = row.getValue<string | undefined>(columnId);
  return typeof searchValue === "string" && searchValue.includes(query);
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
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        onClick={(event) => event.stopPropagation()}
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
    id: "search",
    accessorFn: (row) =>
      [
        row.customerName,
        row.error,
        row.invoiceId,
        row.maskedPan,
        row.reference,
        row.destination,
        row.date,
        row.status,
      ]
        .filter((value): value is string => typeof value === "string")
        .map((value) => value.toLowerCase())
        .join(" "),
    filterFn: searchFilterFn,
    enableHiding: false,
    enableSorting: false,
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
        {row.original.reference ?? "-"}
      </div>
    ),
  },
  {
    accessorKey: "amount",
    header: () => <div className="text-right">Amount</div>,
    cell: ({ row }) => (
      <div className="text-right text-xs font-medium sm:text-sm">
        {formatMonobankMoney(row.original.amount, row.original.ccy)}
      </div>
    ),
  },
  {
    accessorKey: "profitAmount",
    header: () => <div className="text-right">Profit</div>,
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
];
