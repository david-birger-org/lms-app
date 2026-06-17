"use client";
"use no memo";

import {
  type Column,
  type ColumnDef,
  type ColumnFiltersState,
  type FilterFn,
  flexRender,
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
  ArrowUpDown,
  ChevronDown,
  Download,
  ExternalLink,
  Eye,
  FileSpreadsheet,
  Printer,
  ReceiptText,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";

import {
  AdminDataTableCard,
  AdminDataTablePagination,
  AdminDataTableScroll,
  adminDataTableStyles,
} from "@/components/admin/AdminDataTableShell";
import { MonobankPaymentDetailsPopover } from "@/components/admin/MonobankPaymentDetailsPopover";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

type RegistrationPaymentColumnMeta = {
  cellClassName?: string;
  headerClassName?: string;
  label?: string;
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

function statusVariant(status: string) {
  switch (getPaymentStatusKind(status)) {
    case "paid":
      return "default";
    case "failed":
    case "unknown":
      return "destructive";
    case "draft":
      return "outline";
    case "pending":
      return "secondary";
  }
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
    payment.checkStatus,
    payment.checkTaxUrl,
    payment.productSlug,
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

function getColumnMeta(column: Column<AdminRegistrationPaymentRecord>) {
  return column.columnDef.meta as RegistrationPaymentColumnMeta | undefined;
}

function SortableColumnHeader({
  column,
  title,
  className,
}: {
  column: Column<AdminRegistrationPaymentRecord>;
  title: string;
  className?: string;
}) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn(adminDataTableStyles.sortButton, className)}
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
    >
      {title}
      <ArrowUpDown className={adminDataTableStyles.icon} />
    </Button>
  );
}

type RegistrationPaymentLabels = {
  actions: {
    openDetails: (params: { id: string }) => string;
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

function getHttpUrl(value?: string) {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.toString()
      : undefined;
  } catch {
    return undefined;
  }
}

function sanitizeFileNamePart(value: string) {
  return value.replaceAll(/[^a-zA-Z0-9._-]+/g, "-").replaceAll(/^-|-$/g, "");
}

function receiptFileName(payment: AdminRegistrationPaymentRecord) {
  const identifier =
    payment.checkId ?? payment.invoiceId ?? payment.externalRef ?? payment.id;
  return `receipt-${sanitizeFileNamePart(identifier) || "payment"}.pdf`;
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
  const receiptUrl =
    getHttpUrl(payment.checkTaxUrl) ?? getHttpUrl(payment.checkFile);
  if (receiptUrl) return receiptUrl;
  if (payment.checkFile) return payment.checkStatus ?? payment.checkId ?? "PDF";
  return "";
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
    [labels.columns.receipt]: payment.checkStatus ?? payment.checkId ?? "",
    "Receipt URL": getReceiptExportValue(payment),
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
          <div className="flex min-w-[10rem] max-w-[12rem] flex-col gap-0.5 sm:max-w-[16rem]">
            <span className="truncate text-xs font-medium sm:text-sm">
              {payment.customerName || labels.unknownName}
            </span>
            <a
              href={`mailto:${payment.customerEmail}`}
              className="truncate text-[11px] text-muted-foreground hover:underline"
            >
              {payment.customerEmail}
            </a>
            <span className="truncate font-mono text-[10px] text-muted-foreground sm:hidden">
              {payment.externalRef}
            </span>
          </div>
        );
      },
      sortingFn: (a, b) =>
        a.original.customerName.localeCompare(b.original.customerName),
      meta: {
        label: labels.columns.participant,
      },
    },
    {
      accessorKey: "amountMinor",
      header: ({ column }) => (
        <SortableColumnHeader
          column={column}
          title={labels.columns.amount}
          className="ml-auto"
        />
      ),
      cell: ({ row }) => (
        <div className="whitespace-nowrap text-right text-xs font-medium sm:text-sm">
          {formatMoney(row.original.amountMinor, row.original.currency)}
        </div>
      ),
      meta: {
        cellClassName: "text-right",
        headerClassName: "text-right",
        label: labels.columns.amount,
      },
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <SortableColumnHeader column={column} title={labels.columns.status} />
      ),
      filterFn: arrayFilter,
      cell: ({ row }) => (
        <div className="flex max-w-[7.75rem] flex-col gap-0.5">
          <Badge
            variant={statusVariant(row.original.status)}
            className="h-4 max-w-full truncate rounded-md px-1.5 text-[10px] sm:h-5 sm:text-xs"
          >
            {labelStatus(row.original.status, labels)}
          </Badge>
          {row.original.failureReason ? (
            <span className="truncate text-[10px] text-destructive">
              {row.original.failureReason}
            </span>
          ) : row.original.providerStatus ? (
            <span
              className="truncate text-[10px] text-muted-foreground"
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
      cell: ({ row }) =>
        row.original.pageUrl ? (
          <a
            href={row.original.pageUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex max-w-[5.5rem] items-center gap-1 truncate text-[11px] text-primary hover:underline sm:max-w-[10rem] sm:text-xs"
          >
            <ExternalLink className="size-3 shrink-0" />
            <span className="truncate">
              {row.original.invoiceId ?? row.original.pageUrl}
            </span>
          </a>
        ) : (
          <span className="text-muted-foreground">-</span>
        ),
      meta: {
        label: labels.columns.invoice,
      },
    },
    {
      accessorKey: "checkStatus",
      header: ({ column }) => (
        <SortableColumnHeader column={column} title={labels.columns.receipt} />
      ),
      cell: ({ row }) => {
        const payment = row.original;
        const checkHref =
          getHttpUrl(payment.checkTaxUrl) ?? getHttpUrl(payment.checkFile);
        if (checkHref || payment.checkFile) {
          const label = payment.checkStatus ?? payment.checkId ?? "PDF";
          const className =
            "inline-flex max-w-[5rem] items-center gap-1 truncate text-[11px] text-primary hover:underline sm:max-w-[9rem] sm:text-xs";
          return checkHref ? (
            <a
              href={checkHref}
              target="_blank"
              rel="noreferrer"
              className={className}
            >
              <ReceiptText className="size-3 shrink-0" />
              <span className="truncate">{label}</span>
            </a>
          ) : (
            <button
              type="button"
              className={className}
              onClick={() =>
                openReceiptFile(
                  payment.checkFile ?? "",
                  receiptFileName(payment),
                )
              }
            >
              <ReceiptText className="size-3 shrink-0" />
              <span className="truncate">{label}</span>
            </button>
          );
        }
        if (row.original.checkStatus) {
          return (
            <Badge variant="outline" className="h-4 px-1.5 text-[10px]">
              {row.original.checkStatus}
            </Badge>
          );
        }
        return <span className="text-muted-foreground">-</span>;
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
        <Badge
          variant="outline"
          className="h-4 rounded-md px-1.5 text-[10px] sm:h-5 sm:text-xs"
        >
          {labelSource(row.original.source, labels)}
        </Badge>
      ),
      meta: {
        cellClassName: "hidden sm:table-cell",
        headerClassName: "hidden sm:table-cell",
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
        <div className="max-w-[11rem] truncate font-mono text-[11px]">
          {row.original.externalRef}
        </div>
      ),
      meta: {
        cellClassName: "hidden md:table-cell",
        headerClassName: "hidden md:table-cell",
        label: labels.columns.externalRef,
      },
    },
    {
      accessorKey: "paymentCreatedAt",
      header: ({ column }) => (
        <SortableColumnHeader column={column} title={labels.columns.created} />
      ),
      cell: ({ row }) => (
        <div className="whitespace-nowrap text-[11px] text-muted-foreground">
          {formatDateTime(row.original.paymentCreatedAt)}
        </div>
      ),
      sortingFn: (a, b) =>
        new Date(a.original.paymentCreatedAt).getTime() -
        new Date(b.original.paymentCreatedAt).getTime(),
      meta: {
        cellClassName: "hidden lg:table-cell",
        headerClassName: "hidden lg:table-cell",
        label: labels.columns.created,
      },
    },
    {
      accessorKey: "paymentId",
      header: labels.columns.paymentId,
      cell: ({ row }) => (
        <div className="max-w-[12rem] truncate font-mono text-[11px]">
          {row.original.paymentId}
        </div>
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

        return (
          <div className="flex justify-end">
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              aria-label={labels.actions.openDetails({ id: identifier })}
              disabled={!payment.invoiceId}
              onClick={(event) => {
                event.stopPropagation();
                onOpenPaymentDetails(payment);
              }}
            >
              <Eye />
            </Button>
          </div>
        );
      },
      enableHiding: false,
      enableSorting: false,
      meta: {
        cellClassName: "text-right",
        headerClassName: "text-right",
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
  const [detailsOpen, setDetailsOpen] = React.useState(false);

  const labels = React.useMemo<RegistrationPaymentLabels>(
    () => ({
      actions: {
        openDetails: (params) => t("actions.openDetails", params),
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
      setDetailsOpen(true);
    },
    [],
  );
  const handleDetailsOpenChange = React.useCallback((open: boolean) => {
    setDetailsOpen(open);

    if (!open) {
      setActivePaymentDetails(null);
    }
  }, []);
  const columns = React.useMemo(
    () => createColumns(labels, handleOpenPaymentDetails),
    [handleOpenPaymentDetails, labels],
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
    <div className="space-y-2">
      <AdminDataTableCard
        title={t("title")}
        description={t("description", { pending: pendingCount })}
        summaryItems={[
          {
            content: t("summary.total", { count: payments.length }),
            id: "total",
          },
          { content: t("summary.paid", { count: paidCount }), id: "paid" },
          {
            content: t("summary.amount", {
              amount: formatMoney(totalAmount, "UAH"),
            }),
            id: "amount",
          },
          {
            content: t("summary.pending", { count: pendingCount }),
            id: "pending",
          },
        ]}
        toolbar={
          <div className={adminDataTableStyles.toolbar}>
            <Input
              value={searchValue}
              onChange={(event) => {
                setSearchValue(event.target.value);
                table.setPageIndex(0);
              }}
              placeholder={t("toolbar.searchPlaceholder")}
              className={adminDataTableStyles.search}
            />
            <div className={adminDataTableStyles.actionRow}>
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
              <ExportMenu
                disabled={exportRows.length === 0}
                label={t("toolbar.export")}
                pdfLabel={t("toolbar.exportPdf")}
                xlsxLabel={t("toolbar.exportXlsx")}
                onExportPdf={() => printPdf(exportRows, t("title"))}
                onExportXlsx={() =>
                  downloadBlob(
                    createXlsxBlob(exportRows),
                    exportFileName("xlsx"),
                  )
                }
              />
              <Select
                value={String(table.getState().pagination.pageSize)}
                onValueChange={(value) => {
                  table.setPageSize(Number(value));
                  table.setPageIndex(0);
                }}
              >
                <SelectTrigger className={adminDataTableStyles.select}>
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
                  size="sm"
                  className={adminDataTableStyles.control}
                  onClick={resetTable}
                >
                  <X className={adminDataTableStyles.icon} />
                  {t("toolbar.reset")}
                </Button>
              ) : null}
            </div>
          </div>
        }
      >
        <AdminDataTableScroll>
          <Table className={adminDataTableStyles.table}>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const meta = getColumnMeta(header.column);
                    return (
                      <TableHead
                        key={header.id}
                        className={cn(
                          adminDataTableStyles.headerCell,
                          meta?.headerClassName,
                        )}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => {
                      const meta = getColumnMeta(cell.column);
                      return (
                        <TableCell
                          key={cell.id}
                          className={cn(
                            adminDataTableStyles.cell,
                            meta?.cellClassName,
                          )}
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={table.getVisibleLeafColumns().length}
                    className={adminDataTableStyles.emptyCell}
                  >
                    {payments.length === 0 ? t("empty") : t("emptyFiltered")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </AdminDataTableScroll>
        <AdminDataTablePagination
          hidden={payments.length === 0}
          label={
            <span>
              {t("pagination.rows", {
                filtered: table.getFilteredRowModel().rows.length,
                total: payments.length,
              })}
            </span>
          }
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
            hideTrigger
          />
        ) : null}
      </AdminDataTableCard>
    </div>
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
        <Button
          variant="outline"
          size="sm"
          className={adminDataTableStyles.control}
        >
          {label}
          <ChevronDown className={adminDataTableStyles.icon} />
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
        <Button
          variant="outline"
          size="sm"
          className={adminDataTableStyles.control}
        >
          {label}
          <ChevronDown className={adminDataTableStyles.icon} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuGroup>
          {table
            .getAllColumns()
            .filter((column) => column.getCanHide())
            .map((column) => {
              const meta = getColumnMeta(column);
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
          size="sm"
          className={adminDataTableStyles.control}
          disabled={disabled}
        >
          <Download className={adminDataTableStyles.icon} />
          {label}
          <ChevronDown className={adminDataTableStyles.icon} />
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
