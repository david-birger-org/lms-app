import "server-only";

import { headers as getRequestHeaders } from "next/headers";

import { requireAdminPageAccess } from "@/lib/auth/admin-server";
import {
  normalizeStatementRange,
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

export interface AdminStatementSnapshot {
  rows: StatementItem[];
  fetchedAt: number;
}

interface StatementListResponse {
  list?: StatementItem[];
  error?: string;
}

// Shared admin statement fetch behind RequireAdmin: the monobank statement and
// payment history endpoints return the same { list } shape over the same date
// range, differing only by path and default window.
export async function fetchAdminStatement(
  path: string,
  range: StatementRange,
  errorMessage: string,
): Promise<AdminStatementSnapshot> {
  const normalizedRange = normalizeStatementRange(range);
  const access = await requireAdminPageAccess();
  const requestHeaders = await getRequestHeaders();
  const response = await forwardLmsSlsRequest({
    headers: mergeHeaders(
      createTrustedAdminHeaders(access.admin),
      getForwardedSessionHeaders(requestHeaders),
    ),
    method: "GET",
    path,
    search: `?${statementRangeSearchParams(normalizedRange).toString()}`,
  });

  const payload = (await response
    .json()
    .catch(() => null)) as StatementListResponse | null;

  if (!response.ok) throw new Error(payload?.error ?? errorMessage);

  return {
    rows: normalizeStatementRows(
      Array.isArray(payload?.list) ? payload.list : [],
    ),
    fetchedAt: Date.now(),
  };
}

export async function buildInitialStatementState(
  path: string,
  range: StatementRange,
  errorMessage: string,
) {
  const normalizedRange = normalizeStatementRange(range);

  try {
    return {
      initialRange: normalizedRange,
      initialData: await fetchAdminStatement(
        path,
        normalizedRange,
        errorMessage,
      ),
      initialError: null,
    };
  } catch (error) {
    return {
      initialRange: normalizedRange,
      initialData: null,
      initialError: error instanceof Error ? error.message : errorMessage,
    };
  }
}
