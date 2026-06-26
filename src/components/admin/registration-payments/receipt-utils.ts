type ReceiptPayment = {
  checkFile?: string;
  checkId?: string;
  checkTaxUrl?: string;
  externalRef?: string;
  id: string;
  invoiceId?: string;
};

export type ReceiptFile = {
  kind: "pdf" | "url";
  value: string;
};

export function getHttpUrl(value?: string) {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;

  try {
    const url = new URL(trimmed);
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.toString()
      : undefined;
  } catch {
    return undefined;
  }
}

function looksLikePdfData(value?: string) {
  const trimmed = value?.trim();
  if (!trimmed) return false;

  if (/^data:application\/pdf\b/i.test(trimmed)) {
    return true;
  }

  const source = trimmed
    .replaceAll(/\s/g, "")
    .replaceAll("-", "+")
    .replaceAll("_", "/");
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(source)) {
    return false;
  }

  try {
    return globalThis.atob(source.slice(0, 24)).startsWith("%PDF");
  } catch {
    return false;
  }
}

function sanitizeFileNamePart(value: string) {
  return value.replaceAll(/[^a-zA-Z0-9._-]+/g, "-").replaceAll(/^-|-$/g, "");
}

export function receiptFileName(payment: ReceiptPayment) {
  const identifier =
    payment.checkId ?? payment.invoiceId ?? payment.externalRef ?? payment.id;
  return `receipt-${sanitizeFileNamePart(identifier) || "payment"}.pdf`;
}

export function getReceiptFile(
  payment: Pick<ReceiptPayment, "checkFile" | "checkTaxUrl">,
): ReceiptFile | undefined {
  const url = getHttpUrl(payment.checkTaxUrl) ?? getHttpUrl(payment.checkFile);
  if (url) return { kind: "url", value: url };

  if (looksLikePdfData(payment.checkFile)) {
    return { kind: "pdf", value: payment.checkFile ?? "" };
  }

  return undefined;
}

export function getReceiptLabel(payment: Pick<ReceiptPayment, "checkId">) {
  return payment.checkId ?? "PDF";
}
