"use client";
"use no memo";

import { flexRender, type Row, type Table } from "@tanstack/react-table";
import type * as React from "react";

import {
  AdminDataTableScroll,
  adminDataTableStyles,
} from "@/components/admin/AdminDataTableShell";
import { Button } from "@/components/ui/button";
import {
  Table as DataTable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  onEmptyAction,
  table,
}: {
  emptyActionLabel?: string;
  emptyMessage?: string;
  onEmptyAction?: () => void;
  table: Table<StatementItem>;
}) {
  return (
    <AdminDataTableScroll>
      <DataTable className={adminDataTableStyles.table}>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  className={adminDataTableStyles.headerCell}
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
                aria-selected={row.getIsSelected()}
                className="cursor-pointer data-[state=selected]:bg-primary/5 data-[state=selected]:hover:bg-primary/10"
                onClick={(event: React.MouseEvent<HTMLTableRowElement>) => {
                  if (isInteractiveRowTarget(event.target)) {
                    return;
                  }

                  toggleRowSelection(row);
                }}
                onKeyDown={(event) => {
                  if (event.target !== event.currentTarget) {
                    return;
                  }

                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    toggleRowSelection(row);
                  }
                }}
                tabIndex={0}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className={adminDataTableStyles.cell}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={table.getVisibleLeafColumns().length}
                className={adminDataTableStyles.emptyCell}
              >
                <div className="flex flex-col items-center gap-3 py-4">
                  <p className="text-sm text-muted-foreground">
                    {emptyMessage}
                  </p>
                  {emptyActionLabel && onEmptyAction ? (
                    <Button variant="outline" size="sm" onClick={onEmptyAction}>
                      {emptyActionLabel}
                    </Button>
                  ) : null}
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </DataTable>
    </AdminDataTableScroll>
  );
}
