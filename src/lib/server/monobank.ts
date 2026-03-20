import "server-only";

import { headers as getRequestHeaders } from "next/headers";

import {
  DEFAULT_STATEMENT_DAYS,
  type MonobankStatementSnapshot,
  normalizeStatementRows,
  type StatementItem,
} from "@/lib/monobank";
import { getForwardedAuthHeaders, getLmsSlsConfig } from "@/lib/server/lms-sls";

interface StatementResponse {
  list?: StatementItem[];
  error?: string;
}

const STATEMENT_ERROR_MESSAGE = "Failed to load payment history.";

export async function getMonobankStatement(
  days = DEFAULT_STATEMENT_DAYS,
): Promise<MonobankStatementSnapshot> {
  const { apiKey, baseUrl } = getLmsSlsConfig();
  const authHeaders = getForwardedAuthHeaders(await getRequestHeaders());
  const targetUrl = new URL("api/monobank/statement", baseUrl);

  targetUrl.searchParams.set("days", String(days));

  const response = await fetch(targetUrl, {
    headers: {
      "x-internal-api-key": apiKey,
      ...(authHeaders.get("authorization")
        ? { authorization: authHeaders.get("authorization") as string }
        : {}),
      ...(authHeaders.get("cookie")
        ? { cookie: authHeaders.get("cookie") as string }
        : {}),
    },
    cache: "no-store",
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
