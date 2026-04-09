"use client";
"use no memo";

import type { Table } from "@tanstack/react-table";
import { CheckCheck, ChevronDown, RefreshCw, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  downloadTextFile,
  formatStatementItemsAsCsv,
  formatStatementItemsAsRawData,
} from "@/components/admin/payments-table/export-utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
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
import { copyToClipboard } from "@/lib/clipboard";
import type { StatementItem } from "@/lib/monobank";

const pageSizeOptions = [10, 20, 50, 100] as const;

export function MonobankPaymentsTableToolbar({
  table,
  exportFilePrefix,
  isLoading,
  onRefresh,
  onSearchChange,
  selectedStatuses,
  selectedRows,
  searchValue,
  statusOptions,
  selectedPaymentIdentifiers,
  hasActiveState,
  onStatusToggle,
  onReset,
  onClearSelection,
}: {
  table: Table<StatementItem>;
  exportFilePrefix: string;
  isLoading: boolean;
  onRefresh: () => void;
  onSearchChange: (value: string) => void;
  selectedStatuses: string[];
  selectedRows: StatementItem[];
  searchValue: string;
  statusOptions: string[];
  selectedPaymentIdentifiers: string[];
  hasActiveState: boolean;
  onStatusToggle: (status: string, checked: boolean) => void;
  onReset: () => void;
  onClearSelection: () => void;
}) {
  const t = useTranslations("admin.paymentsTable.toolbar");
  const tt = useTranslations("admin.paymentsTable.toasts");
  const selectedRowCount = table.getSelectedRowModel().rows.length;
  const normalizedExportFilePrefix =
    exportFilePrefix
      .trim()
      .toLowerCase()
      .replaceAll(/[^a-z0-9]+/g, "-")
      .replaceAll(/(^-|-$)/g, "") || "payments";

  function getColumnLabel(columnId: string) {
    const labels = {
      profitAmount: "profit",
      maskedPan: "card",
      invoiceId: "invoice id",
    } as Record<string, string>;
    return labels[columnId] ?? columnId;
  }

  async function handleCopySelectedIds() {
    const copied = await copyToClipboard(selectedPaymentIdentifiers.join("\n"));

    if (!copied) {
      toast.error(tt("copyIdsFailed"));
      return;
    }

    toast.success(tt("copyIdsSuccess"));
  }

  async function handleCopySelectedRawData() {
    const copied = await copyToClipboard(
      formatStatementItemsAsRawData(selectedRows),
    );

    if (!copied) {
      toast.error(tt("copyRawFailed"));
      return;
    }

    toast.success(tt("copyRawSuccess"));
  }

  function handleExportSelectedCsv() {
    const timestamp = new Date().toISOString().replaceAll(/[:.]/g, "-");

    downloadTextFile({
      content: formatStatementItemsAsCsv(selectedRows),
      fileName: `${normalizedExportFilePrefix}-selected-${timestamp}.csv`,
      mimeType: "text/csv;charset=utf-8",
    });
    toast.success(tt("exportSuccess"));
  }

  return (
    <div className="flex flex-col gap-2 py-3 md:flex-row md:items-center">
      <Input
        placeholder={t("searchPlaceholder")}
        value={searchValue}
        onChange={(event) => onSearchChange(event.target.value)}
        className="h-9 md:max-w-sm"
      />

      <div className="flex flex-wrap items-center gap-1.5 md:ml-auto">
        {selectedRowCount > 0 ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 px-3">
                <CheckCheck />
                {t("actions")}
                <ChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuGroup>
                <DropdownMenuLabel>
                  {t("selected", { count: selectedRowCount })}
                </DropdownMenuLabel>
                <DropdownMenuItem
                  disabled={selectedRows.length === 0}
                  onClick={() => handleExportSelectedCsv()}
                >
                  {t("exportCsv")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={selectedRows.length === 0}
                  onClick={() => void handleCopySelectedRawData()}
                >
                  {t("copyRawData")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={selectedPaymentIdentifiers.length === 0}
                  onClick={() => void handleCopySelectedIds()}
                >
                  {t("copyIds")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onClearSelection}>
                  {t("clearSelection")}
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 px-3">
              {t("status")}
              <ChevronDown />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuGroup>
              <DropdownMenuLabel>{t("filterStatus")}</DropdownMenuLabel>
              {statusOptions.map((status) => (
                <DropdownMenuCheckboxItem
                  key={status}
                  className="capitalize"
                  checked={selectedStatuses.includes(status)}
                  onCheckedChange={(value) =>
                    onStatusToggle(status, Boolean(value))
                  }
                >
                  {status}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 px-3">
              {t("columns")}
              <ChevronDown />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuGroup>
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(Boolean(value))
                    }
                  >
                    {getColumnLabel(column.id)}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <Select
          value={String(table.getState().pagination.pageSize)}
          onValueChange={(value) => table.setPageSize(Number(value))}
        >
          <SelectTrigger className="h-9 w-20">
            <SelectValue placeholder={t("rows")} />
          </SelectTrigger>
          <SelectContent>
            {pageSizeOptions.map((pageSize) => (
              <SelectItem key={pageSize} value={String(pageSize)}>
                {pageSize}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="sm"
          className="h-9 px-3"
          onClick={onRefresh}
          disabled={isLoading}
        >
          <RefreshCw className={isLoading ? "animate-spin" : undefined} />
          {t("refresh")}
        </Button>

        {hasActiveState ? (
          <Button
            variant="ghost"
            size="sm"
            className="h-9 px-3"
            onClick={onReset}
          >
            <X />
            {t("reset")}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
