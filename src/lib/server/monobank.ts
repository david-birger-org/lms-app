import "server-only";

import { headers as getRequestHeaders } from "next/headers";

import { requireAdminPageAccess } from "@/lib/auth/admin-server";
import {
  createDefaultStatementRange,
  type MonobankStatementSnapshot,
  normalizeStatementRows,
  normalizeStatementRange,
  type StatementItem,
  type StatementRange,
  statementRangeSearchParams,
} from "@/lib/monobank";
import {
  createTrustedAdminHeaders,
  forwardLmsSlsRequest,
  getForwardedSessionHeaders,
  mergeHeaders,
} from "@/lib/server/lms-sls";

interface StatementResponse {
  list?: StatementItem[];
  error?: string;
}

const STATEMENT_ERROR_MESSAGE = "Failed to load payment history.";

export async function getMonobankStatement(
  range: StatementRange = createDefaultStatementRange(),
): Promise<MonobankStatementSnapshot> {
  const normalizedRange = normalizeStatementRange(range);
  const access = await requireAdminPageAccess();
  const requestHeaders = await getRequestHeaders();
  const response = await forwardLmsSlsRequest({
    headers: mergeHeaders(
      createTrustedAdminHeaders(access.admin),
      getForwardedSessionHeaders(requestHeaders),
    ),
    method: "GET",
    path: "/api/monobank/statement",
    search: `?${statementRangeSearchParams(normalizedRange).toString()}`,
  });

  const payload = (await response
    .json()
    .catch(() => null)) as StatementResponse | null;

  if (!response.ok) {
    throw new Error(payload?.error ?? STATEMENT_ERROR_MESSAGE);
  }

  return {
    rows: normalizeStatementRows(
      Array.isArray(payload?.list) ? payload.list : [],
    ),
    fetchedAt: Date.now(),
  };
}

export async function getInitialMonobankStatementState(
  range: StatementRange = createDefaultStatementRange(),
) {
  const normalizedRange = normalizeStatementRange(range);

  try {
    return {
      initialRange: normalizedRange,
      initialData: await getMonobankStatement(normalizedRange),
      initialError: null,
    };
  } catch (error) {
    return {
      initialRange: normalizedRange,
      initialData: null,
      initialError:
        error instanceof Error ? error.message : STATEMENT_ERROR_MESSAGE,
    };
  }
}
