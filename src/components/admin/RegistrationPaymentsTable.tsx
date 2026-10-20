"use client";
"use no memo";

import {
  type ColumnDef,
  type ColumnFiltersState,
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
  ChevronDown,
  Columns3,
  Download,
  ExternalLink,
  Eye,
  FileSpreadsheet,
  Loader2,
  Printer,
  ReceiptText,
  RefreshCw,
  Users,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import * as React from "react";
import { toast } from "sonner";

import {
  AdminDataTable,
  AdminDataTableCard,
  AdminDataTablePagination,
  AdminDataTableToolbar,
  adminDataTableStyles,
} from "@/components/admin/AdminDataTableShell";
import { MonobankPaymentDetailsPopover } from "@/components/admin/MonobankPaymentDetailsPopover";
import { SortableColumnHeader } from "@/components/admin/payments-table/columns";
import {
  getHttpUrl,
  getReceiptFile,
  getReceiptLabel,
  receiptFileName,
} from "@/components/admin/registration-payments/receipt-utils";
import { EmptyState } from "@/components/shell/empty-state";
import {
  getPaymentBadgeStatus,
  StatusBadge,
} from "@/components/shell/status-badge";
import { Badge } from "@/components/ui/badge";
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { StatementItem } from "@/lib/monobank";
import {
  getPaymentStatusKind,
  normalizePaymentStatus,
  resolvePaymentStatus,
} from "@/lib/payments";
import type { AdminRegistrationPaymentRecord } from "@/lib/server/admin-registration-payments";
import { cn } from "@/lib/utils";

const pageSizeOptions = [10, 20, 50, 100] as const;

const defaultColumnVisibility: VisibilityState = {
  paymentId: false,
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
    currencyDisplay: "narrowSymbol",
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

function getSearchValue(payment: AdminRegistrationPaymentRecord) {
  return [
    payment.customerName,
    payment.customerEmail,
    payment.externalRef,
    payment.paymentId,
    payment.invoiceId,
    payment.pageUrl,
    payment.checkId,
    payment.checkTaxUrl,
    payment.productSlug,
    payment.currency,
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

type RegistrationPaymentLabels = {
  actions: {
    deleteRecord: string;
    openDetails: (params: { id: string }) => string;
    syncReceipt: (params: { id: string }) => string;
    syncReceiptFailed: string;
    syncReceiptNotReady: string;
    syncReceiptSuccess: string;
  };
  columns: {
    amount: string;
    created: string;
    details: string;
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
  providerStatusPrefix: string;
  unknownSource: (params: { source: string }) => string;
  unknownStatus: (params: { status: string }) => string;
  unknownName: string;
};

function labelStatus(status: string, labels: RegistrationPaymentLabels) {
  const canonicalStatus = resolvePaymentStatus(status);
  if (canonicalStatus) return labels.statuses[canonicalStatus];

  return labels.unknownStatus({
    status: normalizePaymentStatus(status) ?? "-",
  });
}

function labelSource(source: string, labels: RegistrationPaymentLabels) {
  return labels.sources[source] ?? labels.unknownSource({ source });
}

function toPaymentDetailsSummary(
  payment: AdminRegistrationPaymentRecord,
): StatementItem {
  return {
    amount: payment.amountMinor,
    ccy: payment.currency,
    customerName: payment.customerName,
    date:
      payment.providerModifiedAt ??
      payment.paymentUpdatedAt ??
      payment.paymentCreatedAt,
    destination: payment.description,
    invoiceId: payment.invoiceId,
    pageUrl: payment.pageUrl,
    providerStatus: payment.providerStatus,
    reference: payment.externalRef,
    status: payment.status,
  };
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function fileTimestamp() {
  return new Date().toISOString().replaceAll(/[:.]/g, "-");
}

function exportFileName(extension: "pdf" | "xlsx") {
  return `registration-payments-${fileTimestamp()}.${extension}`;
}

function compactIdentifier(value: string, headLength = 6, tailLength = 4) {
  if (value.length <= headLength + tailLength + 3) return value;
  return `${value.slice(0, headLength)}...${value.slice(-tailLength)}`;
}

function createPdfBlobFromBase64(value: string) {
  const trimmed = value.trim();
  const match = trimmed.match(/^data:application\/pdf[^,]*,(.+)$/i);
  const source = (match?.[1] ?? trimmed)
    .replaceAll(/\s/g, "")
    .replaceAll("-", "+")
    .replaceAll("_", "/");
  const padded = source.padEnd(
    source.length + ((4 - (source.length % 4)) % 4),
    "=",
  );
  const binary = window.atob(padded);
  const buffer = new ArrayBuffer(binary.length);
  const bytes = new Uint8Array(buffer);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new Blob([buffer], { type: "application/pdf" });
}

function openReceiptFile(value: string, fileName: string) {
  const url = getHttpUrl(value);
  if (url) {
    window.open(url, "_blank");
    return;
  }

  const blob = createPdfBlobFromBase64(value);
  const objectUrl = URL.createObjectURL(blob);
  const popup = window.open(objectUrl, "_blank");

  if (!popup) {
    downloadBlob(blob, fileName);
  }

  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
}

function getReceiptExportValue(payment: AdminRegistrationPaymentRecord) {
  const receiptFile = getReceiptFile(payment);
  if (!receiptFile) return payment.checkStatus ?? payment.checkId ?? "";
  if (receiptFile.kind === "url") return receiptFile.value;
  return payment.checkId ?? "PDF saved";
}

function getExportRows(
  rows: AdminRegistrationPaymentRecord[],
  labels: RegistrationPaymentLabels,
) {
  return rows.map((payment) => ({
    [labels.columns.participant]: payment.customerName,
    Email: payment.customerEmail,
    [labels.columns.amount]: (payment.amountMinor / 100).toFixed(2),
    Currency: payment.currency,
    [labels.columns.status]: labelStatus(payment.status, labels),
    [labels.providerStatusPrefix]: payment.providerStatus ?? "",
    [labels.columns.source]: labelSource(payment.source, labels),
    [labels.columns.externalRef]: payment.externalRef,
    [labels.columns.paymentId]: payment.paymentId,
    [labels.columns.invoice]: payment.invoiceId ?? "",
    "Invoice URL": payment.pageUrl ?? "",
    [labels.columns.receipt]: getReceiptExportValue(payment),
    [labels.columns.created]: formatDateTime(payment.paymentCreatedAt),
  }));
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function crc32(data: Uint8Array) {
  let crc = -1;
  for (const byte of data) {
    crc ^= byte;
    for (let i = 0; i < 8; i += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ -1) >>> 0;
}

function uint16(value: number) {
  return [value & 0xff, (value >>> 8) & 0xff];
}

function uint32(value: number) {
  return [
    value & 0xff,
    (value >>> 8) & 0xff,
    (value >>> 16) & 0xff,
    (value >>> 24) & 0xff,
  ];
}

function stringBytes(value: string) {
  return new TextEncoder().encode(value);
}

function createZip(files: Array<{ name: string; content: string }>) {
  const chunks: Uint8Array[] = [];
  const centralDirectory: Uint8Array[] = [];
  let offset = 0;

  for (const file of files) {
    const name = stringBytes(file.name);
    const content = stringBytes(file.content);
    const checksum = crc32(content);
    const localHeader = new Uint8Array([
      0x50,
      0x4b,
      0x03,
      0x04,
      ...uint16(20),
      ...uint16(0),
      ...uint16(0),
      ...uint16(0),
      ...uint16(0),
      ...uint32(checksum),
      ...uint32(content.length),
      ...uint32(content.length),
      ...uint16(name.length),
      ...uint16(0),
      ...name,
    ]);
    chunks.push(localHeader, content);

    const centralHeader = new Uint8Array([
      0x50,
      0x4b,
      0x01,
      0x02,
      ...uint16(20),
      ...uint16(20),
      ...uint16(0),
      ...uint16(0),
      ...uint16(0),
      ...uint16(0),
      ...uint32(checksum),
      ...uint32(content.length),
      ...uint32(content.length),
      ...uint16(name.length),
      ...uint16(0),
      ...uint16(0),
      ...uint16(0),
      ...uint16(0),
      ...uint32(0),
      ...uint32(offset),
      ...name,
    ]);
    centralDirectory.push(centralHeader);
    offset += localHeader.length + content.length;
  }

  const centralOffset = offset;
  const centralSize = centralDirectory.reduce(
    (sum, chunk) => sum + chunk.length,
    0,
  );
  const end = new Uint8Array([
    0x50,
    0x4b,
    0x05,
    0x06,
    ...uint16(0),
    ...uint16(0),
    ...uint16(files.length),
    ...uint16(files.length),
    ...uint32(centralSize),
    ...uint32(centralOffset),
    ...uint16(0),
  ]);

  const parts = [...chunks, ...centralDirectory, end].map((chunk) => {
    const buffer = new ArrayBuffer(chunk.byteLength);
    new Uint8Array(buffer).set(chunk);
    return buffer;
  });

  return new Blob(parts, {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

function columnName(index: number) {
  let value = "";
  let n = index + 1;
  while (n > 0) {
    const remainder = (n - 1) % 26;
    value = String.fromCharCode(65 + remainder) + value;
    n = Math.floor((n - 1) / 26);
  }
  return value;
}

function createXlsxBlob(rows: Array<Record<string, string>>) {
  const headers = Object.keys(rows[0] ?? {});
  const sheetRows = [headers, ...rows.map((row) => headers.map((h) => row[h]))];
  const sheetData = sheetRows
    .map(
      (row, rowIndex) =>
        `<row r="${rowIndex + 1}">${row
          .map((value, columnIndex) => {
            const cell = `${columnName(columnIndex)}${rowIndex + 1}`;
            return `<c r="${cell}" t="inlineStr"><is><t>${escapeXml(
              value ?? "",
            )}</t></is></c>`;
          })
          .join("")}</row>`,
    )
    .join("");

  return createZip([
    {
      name: "[Content_Types].xml",
      content:
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>',
    },
    {
      name: "_rels/.rels",
      content:
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
    },
    {
      name: "xl/workbook.xml",
      content:
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Registration payments" sheetId="1" r:id="rId1"/></sheets></workbook>',
    },
    {
      name: "xl/_rels/workbook.xml.rels",
      content:
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>',
    },
    {
      name: "xl/worksheets/sheet1.xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${sheetData}</sheetData></worksheet>`,
    },
  ]);
}

function printPdf(rows: Array<Record<string, string>>, title: string) {
  const headers = Object.keys(rows[0] ?? {});
  const body = rows
    .map(
      (row) =>
        `<tr>${headers
          .map((header) => `<td>${escapeHtml(row[header] ?? "")}</td>`)
          .join("")}</tr>`,
    )
    .join("");
  const table = `<table><thead><tr>${headers
    .map((header) => `<th>${escapeHtml(header)}</th>`)
    .join("")}</tr></thead><tbody>${body}</tbody></table>`;
  const popup = window.open("", "_blank", "width=1200,height=800");
  if (!popup) return;
  popup.document.write(`<!doctype html>
<html>
<head>
  <title>${escapeHtml(title)}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; margin: 24px; color: #111; }
    h1 { font-size: 18px; margin: 0 0 12px; }
    table { width: 100%; border-collapse: collapse; font-size: 10px; }
    th, td { border: 1px solid #ddd; padding: 4px 5px; text-align: left; vertical-align: top; }
    th { background: #f3f4f6; font-weight: 700; }
    @media print { body { margin: 12mm; } }
  </style>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  ${table}
  <script>window.addEventListener("load", () => setTimeout(() => window.print(), 100));</script>
</body>
</html>`);
  popup.document.close();
}

function createColumns(
  labels: RegistrationPaymentLabels,
  onOpenPaymentDetails: (payment: AdminRegistrationPaymentRecord) => void,
  onSyncReceipt: (payment: AdminRegistrationPaymentRecord) => void,
  syncingReceiptIds: Set<string>,
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
          <div className="flex min-w-0 flex-col gap-0.5 md:max-w-64">
            <span className="truncate text-sm font-medium">
              {payment.customerName || labels.unknownName}
            </span>
            <a
              href={`mailto:${payment.customerEmail}`}
              className="truncate text-xs font-normal text-muted-foreground hover:text-foreground hover:underline"
            >
              {payment.customerEmail}
            </a>
          </div>
        );
      },
      sortingFn: (a, b) =>
        a.original.customerName.localeCompare(b.original.customerName),
      meta: {
        label: labels.columns.participant,
        mobile: "title",
      },
    },
    {
      accessorKey: "amountMinor",
      header: ({ column }) => (
        <SortableColumnHeader column={column} title={labels.columns.amount} />
      ),
      cell: ({ row }) => (
        <span className="font-numeric text-sm font-medium">
          {formatMoney(row.original.amountMinor, row.original.currency)}
        </span>
      ),
      meta: {
        align: "end",
        label: labels.columns.amount,
        mobile: "trailing",
      },
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <SortableColumnHeader column={column} title={labels.columns.status} />
      ),
      filterFn: arrayFilter,
      cell: ({ row }) => (
        <div className="flex max-w-40 flex-col items-end gap-1 md:items-start">
          <StatusBadge status={getPaymentBadgeStatus(row.original.status)}>
            {labelStatus(row.original.status, labels)}
          </StatusBadge>
          {row.original.failureReason ? (
            <span className="max-w-full truncate text-xs text-destructive">
              {row.original.failureReason}
            </span>
          ) : row.original.providerStatus ? (
            <span
              className="font-numeric max-w-full truncate text-[11px] text-muted-foreground"
              title={`Monobank status: ${row.original.providerStatus}`}
            >
              {labels.providerStatusPrefix}: {row.original.providerStatus}
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
      cell: ({ row }) => {
        const payment = row.original;
        if (!payment.pageUrl) {
          return <span className="text-muted-foreground">-</span>;
        }

        const invoiceLabel = payment.invoiceId ?? payment.pageUrl;
        return (
          <a
            href={payment.pageUrl}
            target="_blank"
            rel="noreferrer"
            title={invoiceLabel}
            aria-label={invoiceLabel}
            className="font-numeric inline-flex items-center gap-1 text-xs text-foreground underline-offset-4 hover:underline"
          >
            <span>{compactIdentifier(invoiceLabel)}</span>
            <ExternalLink className="size-3 shrink-0 text-muted-foreground" />
          </a>
        );
      },
      meta: {
        label: labels.columns.invoice,
      },
    },
    {
      id: "receipt",
      accessorFn: (payment) =>
        getReceiptFile(payment) ? getReceiptLabel(payment) : "",
      header: ({ column }) => (
        <SortableColumnHeader column={column} title={labels.columns.receipt} />
      ),
      cell: ({ row }) => {
        const payment = row.original;
        const receiptFile = getReceiptFile(payment);
        if (!receiptFile) {
          if (payment.checkStatus) {
            return (
              <StatusBadge status="neutral">{payment.checkStatus}</StatusBadge>
            );
          }
          return <span className="text-muted-foreground">-</span>;
        }

        const label = getReceiptLabel(payment);
        const className =
          "inline-flex min-h-10 max-w-40 items-center gap-1.5 truncate text-xs text-foreground underline-offset-4 hover:underline md:min-h-0";

        return receiptFile.kind === "url" ? (
          <a
            href={receiptFile.value}
            target="_blank"
            rel="noreferrer"
            className={className}
          >
            <ReceiptText className="size-3.5 shrink-0 text-muted-foreground" />
            <span className="truncate">{label}</span>
          </a>
        ) : (
          <button
            type="button"
            className={className}
            onClick={() =>
              openReceiptFile(receiptFile.value, receiptFileName(payment))
            }
          >
            <ReceiptText className="size-3.5 shrink-0 text-muted-foreground" />
            <span className="truncate">{label}</span>
          </button>
        );
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
        <Badge variant="outline">
          {labelSource(row.original.source, labels)}
        </Badge>
      ),
      meta: {
        cellClassName: "hidden lg:table-cell",
        headerClassName: "hidden lg:table-cell",
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
        <div className="font-numeric text-xs" title={row.original.externalRef}>
          {compactIdentifier(row.original.externalRef, 9, 5)}
        </div>
      ),
      meta: {
        cellClassName: "hidden xl:table-cell",
        headerClassName: "hidden xl:table-cell",
        label: labels.columns.externalRef,
      },
    },
    {
      accessorKey: "paymentCreatedAt",
      header: ({ column }) => (
        <SortableColumnHeader column={column} title={labels.columns.created} />
      ),
      cell: ({ row }) => (
        <span className="font-numeric text-xs text-muted-foreground">
          {formatDateTime(row.original.paymentCreatedAt)}
        </span>
      ),
      sortingFn: (a, b) =>
        new Date(a.original.paymentCreatedAt).getTime() -
        new Date(b.original.paymentCreatedAt).getTime(),
      meta: {
        label: labels.columns.created,
      },
    },
    {
      accessorKey: "paymentId",
      header: labels.columns.paymentId,
      cell: ({ row }) => (
        <span className="font-numeric block max-w-48 truncate text-xs">
          {row.original.paymentId}
        </span>
      ),
      meta: {
        label: labels.columns.paymentId,
      },
    },
    {
      id: "details",
      header: () => <span className="sr-only">{labels.columns.details}</span>,
      cell: ({ row }) => {
        const payment = row.original;
        const identifier =
          payment.invoiceId ?? payment.externalRef ?? payment.paymentId;
        const isSyncingReceipt = syncingReceiptIds.has(payment.paymentId);

        return (
          <div className="flex justify-end gap-1 max-md:-mr-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className={adminDataTableStyles.iconControl}
                  aria-label={labels.actions.syncReceipt({ id: identifier })}
                  disabled={!payment.invoiceId || isSyncingReceipt}
                  onClick={(event) => {
                    event.stopPropagation();
                    onSyncReceipt(payment);
                  }}
                >
                  {isSyncingReceipt ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <RefreshCw />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {labels.actions.syncReceipt({ id: identifier })}
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className={adminDataTableStyles.iconControl}
                  aria-label={labels.actions.openDetails({ id: identifier })}
                  disabled={!payment.invoiceId}
                  onClick={(event) => {
                    event.stopPropagation();
                    onOpenPaymentDetails(payment);
                  }}
                >
                  <Eye />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {labels.actions.openDetails({ id: identifier })}
              </TooltipContent>
            </Tooltip>
          </div>
        );
      },
      enableHiding: false,
      enableSorting: false,
      meta: {
        align: "end",
        cellClassName: "w-px py-1.5",
        label: labels.columns.details,
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
  const router = useRouter();
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "paymentCreatedAt", desc: true },
  ]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [searchValue, setSearchValue] = React.useState("");
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>(defaultColumnVisibility);
  const [activePaymentDetails, setActivePaymentDetails] =
    React.useState<StatementItem | null>(null);
  const [activePaymentId, setActivePaymentId] = React.useState<string | null>(
    null,
  );
  const [syncingReceiptIds, setSyncingReceiptIds] = React.useState<Set<string>>(
    () => new Set(),
  );
  const [detailsOpen, setDetailsOpen] = React.useState(false);

  const labels = React.useMemo<RegistrationPaymentLabels>(
    () => ({
      actions: {
        deleteRecord: t("actions.deleteRecord"),
        openDetails: (params) => t("actions.openDetails", params),
        syncReceipt: (params) => t("actions.syncReceipt", params),
        syncReceiptFailed: t("actions.syncReceiptFailed"),
        syncReceiptNotReady: t("actions.syncReceiptNotReady"),
        syncReceiptSuccess: t("actions.syncReceiptSuccess"),
      },
      columns: {
        amount: t("columns.amount"),
        created: t("columns.created"),
        details: t("columns.details"),
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
      providerStatusPrefix: t("providerStatusPrefix"),
      unknownSource: (params) => t("sources.unknown", params),
      unknownStatus: (params) => t("statuses.unknown", params),
      unknownName: t("unknownName"),
    }),
    [t],
  );

  const handleOpenPaymentDetails = React.useCallback(
    (payment: AdminRegistrationPaymentRecord) => {
      setActivePaymentDetails(toPaymentDetailsSummary(payment));
      setActivePaymentId(payment.paymentId);
      setDetailsOpen(true);
    },
    [],
  );
  const handleDetailsOpenChange = React.useCallback((open: boolean) => {
    setDetailsOpen(open);

    if (!open) {
      setActivePaymentDetails(null);
      setActivePaymentId(null);
    }
  }, []);
  const handleDeleteRegistrationPayment = React.useCallback(async () => {
    if (!activePaymentId) {
      throw new Error("Payment ID is missing.");
    }

    const response = await fetch(
      `/api/registration-payments/${encodeURIComponent(activePaymentId)}`,
      { method: "DELETE" },
    );
    const payload = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;

    if (!response.ok) {
      throw new Error(
        payload?.error ?? "Failed to delete registration payment",
      );
    }

    return null;
  }, [activePaymentId]);
  const canDeleteRegistrationPayment = React.useCallback(
    ({ status }: { invoiceId?: string; status?: string }) => {
      const resolvedStatus = resolvePaymentStatus(status);
      return resolvedStatus !== "paid" && resolvedStatus !== "processing";
    },
    [],
  );
  const handleRegistrationPaymentDeleted = React.useCallback(() => {
    setDetailsOpen(false);
    setActivePaymentDetails(null);
    setActivePaymentId(null);
    router.refresh();
  }, [router]);
  const handleSyncReceipt = React.useCallback(
    async (payment: AdminRegistrationPaymentRecord) => {
      setSyncingReceiptIds((current) =>
        new Set(current).add(payment.paymentId),
      );

      try {
        const response = await fetch(
          `/api/registration-payments/${encodeURIComponent(payment.paymentId)}/fiscal-checks/sync`,
          { method: "POST" },
        );
        const payload = (await response.json().catch(() => null)) as {
          error?: string;
          result?: {
            empty?: number;
            failed?: number;
            scanned?: number;
            synced?: number;
          };
        } | null;

        if (!response.ok) {
          throw new Error(payload?.error ?? labels.actions.syncReceiptFailed);
        }

        if ((payload?.result?.synced ?? 0) > 0) {
          toast.success(labels.actions.syncReceiptSuccess);
        } else {
          toast.message(labels.actions.syncReceiptNotReady);
        }
        router.refresh();
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : labels.actions.syncReceiptFailed,
        );
      } finally {
        setSyncingReceiptIds((current) => {
          const next = new Set(current);
          next.delete(payment.paymentId);
          return next;
        });
      }
    },
    [labels.actions, router],
  );
  const columns = React.useMemo(
    () =>
      createColumns(
        labels,
        handleOpenPaymentDetails,
        handleSyncReceipt,
        syncingReceiptIds,
      ),
    [handleOpenPaymentDetails, handleSyncReceipt, labels, syncingReceiptIds],
  );
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
  const paidCount = payments.filter(
    (payment) => getPaymentStatusKind(payment.status) === "paid",
  ).length;
  const pendingCount = payments.filter(
    (payment) => getPaymentStatusKind(payment.status) === "pending",
  ).length;
  const totalAmount = payments
    .filter((payment) => getPaymentStatusKind(payment.status) === "paid")
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
  const exportPayments = table
    .getSortedRowModel()
    .rows.map((row) => row.original);
  const exportRows = getExportRows(exportPayments, labels);

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
    <AdminDataTableCard
      stats={[
        {
          id: "total",
          label: t("stats.total"),
          value: payments.length,
        },
        { id: "paid", label: t("stats.paid"), value: paidCount },
        {
          id: "amount",
          label: t("stats.paidAmount"),
          value: formatMoney(totalAmount, "UAH"),
        },
        { id: "pending", label: t("stats.pending"), value: pendingCount },
      ]}
      toolbar={
        <AdminDataTableToolbar
          filtersLabel={t("toolbar.filters")}
          activeFilterCount={selectedStatuses.length + selectedSources.length}
          search={
            <Input
              type="search"
              aria-label={t("toolbar.searchPlaceholder")}
              value={searchValue}
              onChange={(event) => {
                setSearchValue(event.target.value);
                table.setPageIndex(0);
              }}
              placeholder={t("toolbar.searchPlaceholder")}
              className={adminDataTableStyles.search}
            />
          }
          filters={
            <>
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
                <SelectTrigger
                  aria-label={t("toolbar.rows")}
                  className={cn(adminDataTableStyles.select, "max-md:w-full")}
                >
                  <span className="text-muted-foreground md:hidden">
                    {t("toolbar.rows")}
                  </span>
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
                  className={adminDataTableStyles.control}
                  onClick={resetTable}
                >
                  <X />
                  {t("toolbar.reset")}
                </Button>
              ) : null}
            </>
          }
          actions={
            <ExportMenu
              disabled={exportRows.length === 0}
              label={t("toolbar.export")}
              pdfLabel={t("toolbar.exportPdf")}
              xlsxLabel={t("toolbar.exportXlsx")}
              onExportPdf={() => printPdf(exportRows, t("title"))}
              onExportXlsx={() =>
                downloadBlob(createXlsxBlob(exportRows), exportFileName("xlsx"))
              }
            />
          }
        />
      }
    >
      <AdminDataTable
        table={table}
        empty={
          <EmptyState
            className="rounded-none border-0"
            icon={Users}
            title={payments.length === 0 ? t("empty") : t("emptyFiltered")}
            action={
              payments.length > 0 ? (
                <Button variant="outline" onClick={resetTable}>
                  {t("toolbar.reset")}
                </Button>
              ) : undefined
            }
          />
        }
      />
      <AdminDataTablePagination
        hidden={table.getFilteredRowModel().rows.length === 0}
        label={t("pagination.rows", {
          filtered: table.getFilteredRowModel().rows.length,
          total: payments.length,
        })}
        previousLabel={t("pagination.previous")}
        nextLabel={t("pagination.next")}
        canPreviousPage={table.getCanPreviousPage()}
        canNextPage={table.getCanNextPage()}
        onPreviousPage={() => table.previousPage()}
        onNextPage={() => table.nextPage()}
      />
      {activePaymentDetails ? (
        <MonobankPaymentDetailsPopover
          invoiceId={activePaymentDetails.invoiceId}
          payment={activePaymentDetails}
          detailsSource="database"
          open={detailsOpen}
          onOpenChange={handleDetailsOpenChange}
          onCancelInvoiceCompleted={handleRegistrationPaymentDeleted}
          cancelInvoiceRequest={handleDeleteRegistrationPayment}
          canCancelInvoice={canDeleteRegistrationPayment}
          cancelButtonLabel={t("actions.deleteRecord")}
          cancellingButtonLabel={t("deleting")}
          cancelConfirmMessage={t("deleteConfirm")}
          hideTrigger
        />
      ) : null}
    </AdminDataTableCard>
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
        <Button variant="outline" className={adminDataTableStyles.control}>
          {label}
          {selectedOptions.length > 0 ? (
            <span className="font-numeric text-muted-foreground">
              {selectedOptions.length}
            </span>
          ) : null}
          <ChevronDown data-icon="inline-end" />
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
        <Button variant="outline" className={adminDataTableStyles.control}>
          <Columns3 />
          {label}
          <ChevronDown data-icon="inline-end" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuGroup>
          {table
            .getAllColumns()
            .filter((column) => column.getCanHide())
            .map((column) => {
              const meta = column.columnDef.meta;
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

function ExportMenu({
  disabled,
  label,
  onExportPdf,
  onExportXlsx,
  pdfLabel,
  xlsxLabel,
}: {
  disabled: boolean;
  label: string;
  onExportPdf: () => void;
  onExportXlsx: () => void;
  pdfLabel: string;
  xlsxLabel: string;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={adminDataTableStyles.control}
          disabled={disabled}
        >
          <Download />
          {label}
          <ChevronDown data-icon="inline-end" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={onExportXlsx}>
            <FileSpreadsheet className="size-4" />
            {xlsxLabel}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onExportPdf}>
            <Printer className="size-4" />
            {pdfLabel}
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
