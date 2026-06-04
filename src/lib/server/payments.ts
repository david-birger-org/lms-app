import "server-only";

import {
  createDefaultStatementRange,
  type StatementRange,
} from "@/lib/monobank";
import {
  DEFAULT_PAYMENT_HISTORY_RANGE_DAYS,
  type PaymentHistorySnapshot,
} from "@/lib/payments";
import {
  buildInitialStatementState,
  fetchAdminStatement,
} from "@/lib/server/admin-statement";

const PAYMENT_HISTORY_PATH = "/api/payments/history";
const PAYMENT_HISTORY_ERROR_MESSAGE = "Failed to load payment history.";

function defaultHistoryRange() {
  return createDefaultStatementRange(DEFAULT_PAYMENT_HISTORY_RANGE_DAYS);
}

export function getPaymentsHistory(
  range: StatementRange = defaultHistoryRange(),
): Promise<PaymentHistorySnapshot> {
  return fetchAdminStatement(
    PAYMENT_HISTORY_PATH,
    range,
    PAYMENT_HISTORY_ERROR_MESSAGE,
  );
}

export function getInitialPaymentsHistoryState(
  range: StatementRange = defaultHistoryRange(),
) {
  return buildInitialStatementState(
    PAYMENT_HISTORY_PATH,
    range,
    PAYMENT_HISTORY_ERROR_MESSAGE,
  );
}
