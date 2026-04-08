import "server-only";

import { headers as getRequestHeaders } from "next/headers";

import { requireAdminPageAccess } from "@/lib/auth/admin-server";
import {
  createDefaultStatementRange,
  type StatementItem,
  type StatementRange,
  statementRangeSearchParams,
} from "@/lib/monobank";
import {
  DEFAULT_PAYMENT_HISTORY_RANGE_DAYS,
  normalizePaymentHistoryRows,
  type PaymentHistorySnapshot,
} from "@/lib/payments";
import {
  createTrustedAdminHeaders,
  forwardLmsSlsRequest,
  getForwardedSessionHeaders,
  mergeHeaders,
} from "@/lib/server/lms-sls";

interface PaymentHistoryResponse {
  list?: StatementItem[];
  error?: string;
}

const PAYMENT_HISTORY_ERROR_MESSAGE = "Failed to load payment history.";

function defaultHistoryRange() {
  return createDefaultStatementRange(DEFAULT_PAYMENT_HISTORY_RANGE_DAYS);
}

export async function getPaymentsHistory(
  range: StatementRange = defaultHistoryRange(),
): Promise<PaymentHistorySnapshot> {
  const access = await requireAdminPageAccess();
  const requestHeaders = await getRequestHeaders();
  const response = await forwardLmsSlsRequest({
    headers: mergeHeaders(
      createTrustedAdminHeaders(access.admin),
      getForwardedSessionHeaders(requestHeaders),
    ),
    method: "GET",
    path: "/api/payments/history",
    search: `?${statementRangeSearchParams(range).toString()}`,
  });

  const payload = (await response
    .json()
    .catch(() => null)) as PaymentHistoryResponse | null;

  if (!response.ok) {
    throw new Error(payload?.error ?? PAYMENT_HISTORY_ERROR_MESSAGE);
  }

  return {
    rows: normalizePaymentHistoryRows(
      Array.isArray(payload?.list) ? payload.list : [],
    ),
    fetchedAt: Date.now(),
  };
}

export async function getInitialPaymentsHistoryState(
  range: StatementRange = defaultHistoryRange(),
) {
  try {
    return {
      initialRange: range,
      initialData: await getPaymentsHistory(range),
      initialError: null,
    };
  } catch (error) {
    return {
      initialRange: range,
      initialData: null,
      initialError:
        error instanceof Error ? error.message : PAYMENT_HISTORY_ERROR_MESSAGE,
    };
  }
}
