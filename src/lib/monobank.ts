export const DEFAULT_STATEMENT_RANGE_DAYS = 30;

export interface StatementRange {
  from: number;
  to: number;
}

export function createDefaultStatementRange(
  days = DEFAULT_STATEMENT_RANGE_DAYS,
): StatementRange {
  const to = Math.floor(Date.now() / 1000);
  const from = to - days * 24 * 60 * 60;

  return { from, to };
}

export function statementRangeKey(range: StatementRange) {
  return `${range.from}-${range.to}`;
}

export function statementRangeSearchParams(range: StatementRange) {
  return new URLSearchParams({
    from: String(range.from),
    to: String(range.to),
  });
}

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

// ISO 3166-1 numeric → alpha-2. UA, US, and EU member states.
const COUNTRY_CODE_BY_NUMERIC: Record<string, string> = {
  "804": "UA",
  "840": "US",
  "040": "AT",
  "056": "BE",
  "100": "BG",
  "191": "HR",
  "196": "CY",
  "203": "CZ",
  "208": "DK",
  "233": "EE",
  "246": "FI",
  "250": "FR",
  "276": "DE",
  "300": "GR",
  "348": "HU",
  "372": "IE",
  "380": "IT",
  "428": "LV",
  "440": "LT",
  "442": "LU",
  "470": "MT",
  "528": "NL",
  "616": "PL",
  "620": "PT",
  "642": "RO",
  "703": "SK",
  "705": "SI",
  "724": "ES",
  "752": "SE",
};

export function formatCountryCode(value?: string) {
  if (!value) return "-";
  const padded = value.padStart(3, "0");
  return COUNTRY_CODE_BY_NUMERIC[padded] ?? value;
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
