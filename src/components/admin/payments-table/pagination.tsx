"use client";
"use no memo";

import type { Table } from "@tanstack/react-table";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import type { StatementItem } from "@/lib/monobank";

export function MonobankPaymentsTablePagination({
  table,
}: {
  table: Table<StatementItem>;
}) {
  const t = useTranslations("admin.paymentsTable.pagination");
  const filteredRowCount = table.getFilteredRowModel().rows.length;
  const visibleSelectedRowCount =
    table.getFilteredSelectedRowModel().rows.length;
  const selectedRowCount = table.getSelectedRowModel().rows.length;
  const selectionLabel =
    visibleSelectedRowCount === selectedRowCount
      ? t("rowsSelected", {
          visible: selectedRowCount,
          filtered: filteredRowCount,
        })
      : t("rowsSelectedTotal", {
          visible: visibleSelectedRowCount,
          filtered: filteredRowCount,
          total: selectedRowCount,
        });

  return (
    <div className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-end">
      <div className="flex-1 text-xs text-muted-foreground sm:text-sm">
        {selectionLabel}
      </div>
      <div className="flex gap-2 self-end">
        <Button
          variant="outline"
          size="sm"
          className="h-9 px-3"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          {t("previous")}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-9 px-3"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          {t("next")}
        </Button>
      </div>
    </div>
  );
}
