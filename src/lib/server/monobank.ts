import "server-only";

import { headers as getRequestHeaders } from "next/headers";

import { requireAdminPageAccess } from "@/lib/auth/admin-server";
import {
  createDefaultStatementRange,
  type MonobankStatementSnapshot,
  normalizeStatementRows,
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
  const access = await requireAdminPageAccess();
  const requestHeaders = await getRequestHeaders();
  const response = await forwardLmsSlsRequest({
    headers: mergeHeaders(
      createTrustedAdminHeaders(access.admin),
      getForwardedSessionHeaders(requestHeaders),
    ),
    method: "GET",
    path: "/api/monobank/statement",
    search: `?${statementRangeSearchParams(range).toString()}`,
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
  try {
    return {
      initialRange: range,
      initialData: await getMonobankStatement(range),
      initialError: null,
    };
  } catch (error) {
    return {
      initialRange: range,
      initialData: null,
      initialError:
        error instanceof Error ? error.message : STATEMENT_ERROR_MESSAGE,
    };
  }
}
