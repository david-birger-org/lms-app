import "server-only";

import {
  createDefaultStatementRange,
  type StatementRange,
} from "@/lib/monobank";
import { buildInitialStatementState } from "@/lib/server/admin-statement";

const STATEMENT_PATH = "/api/monobank/statement";
const STATEMENT_ERROR_MESSAGE = "Failed to load payment history.";

export function getInitialMonobankStatementState(
  range: StatementRange = createDefaultStatementRange(),
) {
  return buildInitialStatementState(
    STATEMENT_PATH,
    range,
    STATEMENT_ERROR_MESSAGE,
  );
}
