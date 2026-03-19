"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  DEFAULT_STATEMENT_DAYS,
  type MonobankStatementSnapshot,
  normalizeStatementRows,
  type StatementItem,
} from "@/lib/monobank";

const STATEMENT_CACHE_TTL_MS = 60_000;

interface StatementResponse {
  list?: StatementItem[];
  error?: string;
}

interface MonobankStatementContextValue {
  state: {
    rows: StatementItem[];
    error: string | null;
    status: "loading" | "ready" | "error";
    isLoading: boolean;
  };
  actions: {
    refresh: () => Promise<void>;
  };
  meta: {
    days: number;
    lastFetchedAt: number | null;
  };
}

const statementCache = new Map<number, MonobankStatementSnapshot>();
const statementRequests = new Map<number, Promise<MonobankStatementSnapshot>>();

const MonobankStatementContext =
  createContext<MonobankStatementContextValue | null>(null);

function getStatementSeed(
  days: number,
  initialData?: MonobankStatementSnapshot | null,
) {
  const cachedStatement = statementCache.get(days);

  if (!cachedStatement) {
    return initialData ?? null;
  }

  if (!initialData) {
    return cachedStatement;
  }

  return cachedStatement.fetchedAt >= initialData.fetchedAt
    ? cachedStatement
    : initialData;
}

async function fetchStatement(days: number, forceRefresh = false) {
  const now = Date.now();
  const cached = statementCache.get(days);

  if (
    !forceRefresh &&
    cached &&
    now - cached.fetchedAt < STATEMENT_CACHE_TTL_MS
  ) {
    return cached;
  }

  const inflightRequest = statementRequests.get(days);
  if (!forceRefresh && inflightRequest) {
    return inflightRequest;
  }

  const request = (async () => {
    const response = await fetch(`/api/monobank/statement?days=${days}`, {
      method: "GET",
      cache: "no-store",
    });

    const payload = (await response.json()) as StatementResponse;

    if (!response.ok) {
      throw new Error(payload.error ?? "Failed to load payment history");
    }

    const rows = normalizeStatementRows(
      Array.isArray(payload.list) ? payload.list : [],
    );

    const nextCache: MonobankStatementSnapshot = {
      rows,
      fetchedAt: Date.now(),
    };

    statementCache.set(days, nextCache);

    return nextCache;
  })();

  statementRequests.set(days, request);

  try {
    return await request;
  } finally {
    statementRequests.delete(days);
  }
}

export function MonobankStatementProvider({
  children,
  days = DEFAULT_STATEMENT_DAYS,
  initialData = null,
  initialError = null,
}: {
  children: ReactNode;
  days?: number;
  initialData?: MonobankStatementSnapshot | null;
  initialError?: string | null;
}) {
  const seed = getStatementSeed(days, initialData);
  const [rows, setRows] = useState<StatementItem[]>(seed?.rows ?? []);
  const [error, setError] = useState<string | null>(initialError);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    initialError ? "error" : seed ? "ready" : "loading",
  );
  const [lastFetchedAt, setLastFetchedAt] = useState<number | null>(
    seed?.fetchedAt ?? null,
  );

  const loadStatement = useCallback(
    async (forceRefresh = false) => {
      setStatus("loading");
      setError(null);

      try {
        const nextStatement = await fetchStatement(days, forceRefresh);
        setRows(nextStatement.rows);
        setLastFetchedAt(nextStatement.fetchedAt);
        setStatus("ready");
      } catch (loadError) {
        const message =
          loadError instanceof Error ? loadError.message : "Unexpected error";
        setError(message);
        setStatus("error");
      }
    },
    [days],
  );

  useEffect(() => {
    if (!initialData) {
      return;
    }

    const cachedStatement = statementCache.get(days);

    if (!cachedStatement || cachedStatement.fetchedAt < initialData.fetchedAt) {
      statementCache.set(days, initialData);
    }
  }, [days, initialData]);

  useEffect(() => {
    if (seed || initialError) {
      return;
    }

    void loadStatement();
  }, [initialError, loadStatement, seed]);

  const refresh = useCallback(async () => {
    await loadStatement(true);
  }, [loadStatement]);

  const value = useMemo<MonobankStatementContextValue>(
    () => ({
      state: {
        rows,
        error,
        status,
        isLoading: status === "loading",
      },
      actions: {
        refresh,
      },
      meta: {
        days,
        lastFetchedAt,
      },
    }),
    [days, error, lastFetchedAt, refresh, rows, status],
  );

  return (
    <MonobankStatementContext.Provider value={value}>
      {children}
    </MonobankStatementContext.Provider>
  );
}

export function useMonobankStatement() {
  const context = useContext(MonobankStatementContext);

  if (!context) {
    throw new Error(
      "useMonobankStatement must be used within a MonobankStatementProvider.",
    );
  }

  return context;
}
