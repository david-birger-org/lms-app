import "server-only";

import { headers as getRequestHeaders } from "next/headers";

import { requireAdminPageAccess } from "@/lib/auth/admin-server";
import {
  DEFAULT_STATEMENT_DAYS,
  type MonobankStatementSnapshot,
  normalizeStatementRows,
  type StatementItem,
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
  days = DEFAULT_STATEMENT_DAYS,
): Promise<MonobankStatementSnapshot> {
  const access = await requireAdminPageAccess();
  const requestHeaders = await getRequestHeaders();
  const searchParams = new URLSearchParams({ days: String(days) });
  const response = await forwardLmsSlsRequest({
    headers: mergeHeaders(
      createTrustedAdminHeaders(access.admin),
      getForwardedSessionHeaders(requestHeaders),
    ),
    method: "GET",
    path: "/api/monobank/statement",
    search: `?${searchParams.toString()}`,
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
  days = DEFAULT_STATEMENT_DAYS,
) {
  try {
    return {
      initialData: await getMonobankStatement(days),
      initialError: null,
    };
  } catch (error) {
    return {
      initialData: null,
      initialError:
        error instanceof Error ? error.message : STATEMENT_ERROR_MESSAGE,
    };
  }
}
