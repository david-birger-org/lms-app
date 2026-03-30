export const DEFAULT_STATEMENT_DAYS = 90;

export type MonobankCurrency = number | string;

export interface StatementItem {
  invoiceId?: string;
  status?: string;
  maskedPan?: string;
  date?: string;
  amount?: number;
  profitAmount?: number;
  ccy?: MonobankCurrency;
  reference?: string;
  destination?: string;
  customerName?: string;
  error?: string;
  expiresAt?: string;
  pageUrl?: string;
}

export interface PendingInvoiceItem {
  amount: number;
  createdDate: string;
  currency: MonobankCurrency;
  customerName: string;
  description: string;
  error?: string;
  expiresAt?: string;
  invoiceId: string;
  pageUrl?: string;
  reference: string;
  status: string;
}

export function mapPendingInvoiceToStatementItem(
  invoice: PendingInvoiceItem,
): StatementItem {
  return {
    amount: invoice.amount,
    ccy: invoice.currency,
    customerName: invoice.customerName,
    date: invoice.createdDate,
    destination: invoice.description,
    error: invoice.error,
    expiresAt: invoice.expiresAt,
    invoiceId: invoice.invoiceId,
    pageUrl: invoice.pageUrl,
    reference: invoice.reference,
    status: invoice.status,
  };
}

export interface MonobankStatementSnapshot {
  rows: StatementItem[];
  fetchedAt: number;
}

export function normalizeStatementRows(list: StatementItem[]) {
  return [...list].sort((left, right) => {
    const leftTime = left.date ? new Date(left.date).getTime() : 0;
    const rightTime = right.date ? new Date(right.date).getTime() : 0;

    return rightTime - leftTime;
  });
}

export function getMonobankCurrencyLabel(ccy?: MonobankCurrency) {
  if (typeof ccy === "string") {
    const normalized = ccy.trim().toUpperCase();

    return normalized || "-";
  }

  if (ccy === 980) {
    return "UAH";
  }

  if (ccy === 840) {
    return "USD";
  }

  return ccy ? String(ccy) : "-";
}

export function formatMonobankMoney(
  minorUnits?: number,
  ccy?: MonobankCurrency,
) {
  if (typeof minorUnits !== "number") {
    return "-";
  }

  return `${(minorUnits / 100).toFixed(2)} ${getMonobankCurrencyLabel(ccy)}`;
}

export function formatMonobankDate(value?: string) {
  if (!value) {
    return "-";
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString();
}

export function formatMonobankShortDate(value?: string) {
  if (!value) {
    return "-";
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "2-digit",
  });
}
