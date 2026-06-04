import "server-only";

import {
  createDefaultStatementRange,
  type MonobankStatementSnapshot,
  type StatementRange,
} from "@/lib/monobank";
import {
  buildInitialStatementState,
  fetchAdminStatement,
} from "@/lib/server/admin-statement";

const STATEMENT_PATH = "/api/monobank/statement";
const STATEMENT_ERROR_MESSAGE = "Failed to load payment history.";

export function getMonobankStatement(
  range: StatementRange = createDefaultStatementRange(),
): Promise<MonobankStatementSnapshot> {
  return fetchAdminStatement(STATEMENT_PATH, range, STATEMENT_ERROR_MESSAGE);
}

export function getInitialMonobankStatementState(
  range: StatementRange = createDefaultStatementRange(),
) {
  return buildInitialStatementState(
    STATEMENT_PATH,
    range,
    STATEMENT_ERROR_MESSAGE,
  );
}
