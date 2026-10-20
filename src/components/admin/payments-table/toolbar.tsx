"use client";
"use no memo";

import type { Table } from "@tanstack/react-table";
import { CheckCheck, ChevronDown, Columns3, RefreshCw, X } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { toast } from "sonner";

import {
  AdminDataTableToolbar,
  adminDataTableStyles,
} from "@/components/admin/AdminDataTableShell";
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
import { cn } from "@/lib/utils";

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
  getStatusLabel,
  selectedPaymentIdentifiers,
  hasActiveState,
  onStatusToggle,
  onReset,
  onClearSelection,
  leading,
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
  getStatusLabel: (status: string) => string;
  selectedPaymentIdentifiers: string[];
  hasActiveState: boolean;
  onStatusToggle: (status: string, checked: boolean) => void;
  onReset: () => void;
  onClearSelection: () => void;
  leading?: ReactNode;
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

  const filters = (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className={adminDataTableStyles.control}>
            {t("status")}
            {selectedStatuses.length > 0 ? (
              <span className="font-numeric text-muted-foreground">
                {selectedStatuses.length}
              </span>
            ) : null}
            <ChevronDown data-icon="inline-end" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuGroup>
            <DropdownMenuLabel>{t("filterStatus")}</DropdownMenuLabel>
            {statusOptions.map((status) => (
              <DropdownMenuCheckboxItem
                key={status}
                checked={selectedStatuses.includes(status)}
                onCheckedChange={(value) =>
                  onStatusToggle(status, Boolean(value))
                }
              >
                {getStatusLabel(status)}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className={adminDataTableStyles.control}>
            <Columns3 />
            {t("columns")}
            <ChevronDown data-icon="inline-end" />
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
                  checked={column.getIsVisible()}
                  onCheckedChange={(value) =>
                    column.toggleVisibility(Boolean(value))
                  }
                >
                  {column.columnDef.meta?.label ?? column.id}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <Select
        value={String(table.getState().pagination.pageSize)}
        onValueChange={(value) => table.setPageSize(Number(value))}
      >
        <SelectTrigger
          aria-label={t("rows")}
          className={cn(adminDataTableStyles.select, "max-md:w-full")}
        >
          <span className="text-muted-foreground md:hidden">{t("rows")}</span>
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

      {hasActiveState ? (
        <Button
          variant="ghost"
          className={adminDataTableStyles.control}
          onClick={onReset}
        >
          <X />
          {t("reset")}
        </Button>
      ) : null}
    </>
  );

  return (
    <AdminDataTableToolbar
      filtersLabel={t("filters")}
      activeFilterCount={selectedStatuses.length}
      leading={leading}
      search={
        <Input
          type="search"
          aria-label={t("searchPlaceholder")}
          placeholder={t("searchPlaceholder")}
          value={searchValue}
          onChange={(event) => onSearchChange(event.target.value)}
          className={adminDataTableStyles.search}
        />
      }
      filters={filters}
      actions={
        <>
          {selectedRowCount > 0 ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className={adminDataTableStyles.control}
                >
                  <CheckCheck />
                  <span className="font-numeric">{selectedRowCount}</span>
                  <span className="max-md:sr-only">{t("actions")}</span>
                  <ChevronDown data-icon="inline-end" />
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

          <Button
            variant="outline"
            className={cn(
              adminDataTableStyles.control,
              "max-md:w-10 max-md:px-0",
            )}
            onClick={onRefresh}
            disabled={isLoading}
            aria-label={t("refresh")}
          >
            <RefreshCw className={cn(isLoading && "animate-spin")} />
            <span className="max-md:sr-only">{t("refresh")}</span>
          </Button>
        </>
      }
    />
  );
}
