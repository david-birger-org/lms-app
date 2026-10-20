"use client";
"use no memo";

import type { Row, Table } from "@tanstack/react-table";
import { ReceiptText } from "lucide-react";

import { AdminDataTable } from "@/components/admin/AdminDataTableShell";
import { EmptyState } from "@/components/shell/empty-state";
import { Button } from "@/components/ui/button";
import type { StatementItem } from "@/lib/monobank";

const interactiveRowSelector = [
  "a[href]",
  "button",
  "input",
  "select",
  "textarea",
  "[role='button']",
  "[role='checkbox']",
  "[role='menuitem']",
  "[data-row-interactive='true']",
].join(",");

function isInteractiveRowTarget(target: EventTarget | null) {
  return (
    target instanceof Element && target.closest(interactiveRowSelector) !== null
  );
}

function toggleRowSelection(row: Row<StatementItem>) {
  row.toggleSelected(!row.getIsSelected());
}

export function MonobankPaymentsTableContent({
  emptyActionLabel,
  emptyMessage = "No results.",
  isLoading,
  onEmptyAction,
  table,
}: {
  emptyActionLabel?: string;
  emptyMessage?: string;
  isLoading?: boolean;
  onEmptyAction?: () => void;
  table: Table<StatementItem>;
}) {
  return (
    <AdminDataTable
      table={table}
      isLoading={isLoading}
      empty={
        <EmptyState
          className="rounded-none border-0"
          icon={ReceiptText}
          title={emptyMessage}
          action={
            emptyActionLabel && onEmptyAction ? (
              <Button variant="outline" onClick={onEmptyAction}>
                {emptyActionLabel}
              </Button>
            ) : undefined
          }
        />
      }
      getRowProps={(row) => ({
        "aria-selected": row.getIsSelected(),
        className: "cursor-pointer",
        tabIndex: 0,
        onClick: (event) => {
          if (isInteractiveRowTarget(event.target)) return;
          toggleRowSelection(row);
        },
        onKeyDown: (event) => {
          if (event.target !== event.currentTarget) return;
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            toggleRowSelection(row);
          }
        },
      })}
    />
  );
}
