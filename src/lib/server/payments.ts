import "server-only";

import {
  createDefaultStatementRange,
  type StatementRange,
} from "@/lib/monobank";
import { DEFAULT_PAYMENT_HISTORY_RANGE_DAYS } from "@/lib/payments";
import { buildInitialStatementState } from "@/lib/server/admin-statement";

const PAYMENT_HISTORY_PATH = "/api/payments/history";
const PAYMENT_HISTORY_ERROR_MESSAGE = "Failed to load payment history.";

function defaultHistoryRange() {
  return createDefaultStatementRange(DEFAULT_PAYMENT_HISTORY_RANGE_DAYS);
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
