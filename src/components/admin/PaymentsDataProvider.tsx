"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  createDefaultStatementRange,
  type MonobankStatementSnapshot,
  normalizeStatementRows,
  normalizeStatementRange,
  type StatementItem,
  type StatementRange,
  statementRangeKey,
  statementRangeSearchParams,
} from "@/lib/monobank";
import {
  DEFAULT_PAYMENT_HISTORY_RANGE_DAYS,
  normalizePaymentHistoryRows,
  type PaymentDetailsSource,
  type PaymentHistorySnapshot,
} from "@/lib/payments";

type PaymentsFeedStatus = "loading" | "ready" | "error";

interface PaymentsFeedSnapshot {
  rows: StatementItem[];
  fetchedAt: number;
}

interface PaymentsFeedResponse {
  list?: StatementItem[];
  error?: string;
}

interface PaymentsFeedContextValue {
  state: {
    rows: StatementItem[];
    error: string | null;
    status: PaymentsFeedStatus;
    isLoading: boolean;
  };
  actions: {
    refresh: () => Promise<void>;
    setRange: (range: StatementRange) => void;
  };
  meta: {
    range: StatementRange;
    lastFetchedAt: number | null;
  };
}

interface PaymentsFeedProviderProps {
  children: ReactNode;
  initialRange: StatementRange;
  initialData?: PaymentsFeedSnapshot | null;
  initialError?: string | null;
}

interface LoadFeedOptions {
  background?: boolean;
  forceRefresh?: boolean;
}

interface AutoRefreshOptions {
  intervalMs?: number;
  refreshOnFocus?: boolean;
  refreshOnVisible?: boolean;
}

interface CreatePaymentsFeedOptions {
  errorMessage: string;
  basePath: string;
  normalizeRows: (rows: StatementItem[]) => StatementItem[];
  autoRefresh?: AutoRefreshOptions;
}

function createPaymentsFeed({
  errorMessage,
  basePath,
  normalizeRows,
  autoRefresh,
}: CreatePaymentsFeedOptions) {
  const cache = new Map<string, PaymentsFeedSnapshot>();
  const requests = new Map<string, Promise<PaymentsFeedSnapshot>>();
  const Context = createContext<PaymentsFeedContextValue | null>(null);

  function getSeed(
    range: StatementRange,
    initialData?: PaymentsFeedSnapshot | null,
  ): PaymentsFeedSnapshot | null {
    const cachedSnapshot = cache.get(statementRangeKey(range));

    if (!cachedSnapshot) {
      return initialData ?? null;
    }

    if (!initialData) {
      return cachedSnapshot;
    }

    return cachedSnapshot.fetchedAt >= initialData.fetchedAt
      ? cachedSnapshot
      : initialData;
  }

  async function fetchFeed(range: StatementRange, forceRefresh = false) {
    const key = statementRangeKey(range);
    const now = Date.now();
    const cachedSnapshot = cache.get(key);

    if (
      !forceRefresh &&
      cachedSnapshot &&
      now - cachedSnapshot.fetchedAt < 60_000
    ) {
      return cachedSnapshot;
    }

    const inflightRequest = requests.get(key);

    if (!forceRefresh && inflightRequest) {
      return inflightRequest;
    }

    const request = (async () => {
      const url = `${basePath}?${statementRangeSearchParams(range).toString()}`;
      const response = await fetch(url, {
        method: "GET",
        cache: "no-store",
      });
      const payload = (await response.json()) as PaymentsFeedResponse;

      if (!response.ok) {
        throw new Error(payload.error ?? errorMessage);
      }

      const nextSnapshot: PaymentsFeedSnapshot = {
        rows: normalizeRows(Array.isArray(payload.list) ? payload.list : []),
        fetchedAt: Date.now(),
      };

      cache.set(key, nextSnapshot);

      return nextSnapshot;
    })();

    requests.set(key, request);

    try {
      return await request;
    } finally {
      requests.delete(key);
    }
  }

  function Provider({
    children,
    initialRange,
    initialData = null,
    initialError = null,
  }: PaymentsFeedProviderProps) {
    const [range, setRangeState] = useState<StatementRange>(initialRange);
    const seed = getSeed(range, initialData);
    const [rows, setRows] = useState<StatementItem[]>(seed?.rows ?? []);
    const [error, setError] = useState<string | null>(initialError);
    const [status, setStatus] = useState<PaymentsFeedStatus>(
      initialError ? "error" : seed ? "ready" : "loading",
    );
    const [lastFetchedAt, setLastFetchedAt] = useState<number | null>(
      seed?.fetchedAt ?? null,
    );
    const isMountedRef = useRef(false);
    const activeRequestIdRef = useRef(0);

    useEffect(() => {
      isMountedRef.current = true;

      return () => {
        isMountedRef.current = false;
        activeRequestIdRef.current += 1;
      };
    }, []);

    const loadFeed = useCallback(
      async ({
        background = false,
        forceRefresh = false,
      }: LoadFeedOptions = {}) => {
        if (!isMountedRef.current) {
          return;
        }

        const requestId = activeRequestIdRef.current + 1;
        activeRequestIdRef.current = requestId;

        if (!background) {
          setStatus("loading");
          setError(null);
        }

        try {
          const nextSnapshot = await fetchFeed(range, forceRefresh);

          if (
            !isMountedRef.current ||
            activeRequestIdRef.current !== requestId
          ) {
            return;
          }

          setRows(nextSnapshot.rows);
          setLastFetchedAt(nextSnapshot.fetchedAt);
          setStatus("ready");
        } catch (loadError) {
          if (
            !isMountedRef.current ||
            activeRequestIdRef.current !== requestId
          ) {
            return;
          }

          const message =
            loadError instanceof Error ? loadError.message : errorMessage;
          setError(message);
          setStatus("error");
        }
      },
      [range],
    );

    useEffect(() => {
      if (!initialData) {
        return;
      }

      const key = statementRangeKey(initialRange);
      const cachedSnapshot = cache.get(key);

      if (!cachedSnapshot || cachedSnapshot.fetchedAt < initialData.fetchedAt) {
        cache.set(key, initialData);
      }
    }, [initialData, initialRange]);

    useEffect(() => {
      const cachedSnapshot = cache.get(statementRangeKey(range));

      if (cachedSnapshot && Date.now() - cachedSnapshot.fetchedAt < 60_000) {
        setRows(cachedSnapshot.rows);
        setLastFetchedAt(cachedSnapshot.fetchedAt);
        setStatus("ready");
        setError(null);
        return;
      }

      void loadFeed();
    }, [loadFeed, range]);

    useEffect(() => {
      if (!autoRefresh) {
        return;
      }

      const refreshInBackground = () =>
        void loadFeed({ background: true, forceRefresh: true });

      const handleFocus = () => {
        if (autoRefresh.refreshOnFocus) {
          refreshInBackground();
        }
      };

      const handleVisibilityChange = () => {
        if (
          autoRefresh.refreshOnVisible &&
          document.visibilityState === "visible"
        ) {
          refreshInBackground();
        }
      };

      const intervalId =
        autoRefresh.intervalMs === undefined
          ? null
          : window.setInterval(() => {
              if (
                !autoRefresh.refreshOnVisible ||
                document.visibilityState === "visible"
              ) {
                refreshInBackground();
              }
            }, autoRefresh.intervalMs);

      if (autoRefresh.refreshOnFocus) {
        window.addEventListener("focus", handleFocus);
      }

      if (autoRefresh.refreshOnVisible) {
        document.addEventListener("visibilitychange", handleVisibilityChange);
      }

      return () => {
        if (intervalId !== null) {
          window.clearInterval(intervalId);
        }

        if (autoRefresh.refreshOnFocus) {
          window.removeEventListener("focus", handleFocus);
        }

        if (autoRefresh.refreshOnVisible) {
          document.removeEventListener(
            "visibilitychange",
            handleVisibilityChange,
          );
        }
      };
    }, [loadFeed]);

    const refresh = useCallback(async () => {
      await loadFeed({ forceRefresh: true });
    }, [loadFeed]);

    const setRange = useCallback((nextRange: StatementRange) => {
      const normalizedRange = normalizeStatementRange(nextRange);

      setRangeState((current) =>
        statementRangeKey(current) === statementRangeKey(normalizedRange)
          ? current
          : normalizedRange,
      );
    }, []);

    const value = useMemo<PaymentsFeedContextValue>(
      () => ({
        state: {
          rows,
          error,
          status,
          isLoading: status === "loading",
        },
        actions: {
          refresh,
          setRange,
        },
        meta: {
          range,
          lastFetchedAt,
        },
      }),
      [error, lastFetchedAt, range, refresh, rows, setRange, status],
    );

    return <Context.Provider value={value}>{children}</Context.Provider>;
  }

  function useFeed(hookName: string, providerName: string) {
    const context = useContext(Context);

    if (!context) {
      throw new Error(`${hookName} must be used within a ${providerName}.`);
    }

    return context;
  }

  return {
    Context,
    Provider,
    useFeed,
  };
}

const paymentsHistoryFeed = createPaymentsFeed({
  errorMessage: "Failed to load payment history",
  basePath: "/api/payments/history",
  normalizeRows: normalizePaymentHistoryRows,
  autoRefresh: {
    intervalMs: 30_000,
    refreshOnFocus: true,
    refreshOnVisible: true,
  },
});

const monobankStatementFeed = createPaymentsFeed({
  errorMessage: "Failed to load statement",
  basePath: "/api/monobank/statement",
  normalizeRows: normalizeStatementRows,
});

export function PaymentsHistoryProvider({
  children,
  initialRange = createDefaultStatementRange(
    DEFAULT_PAYMENT_HISTORY_RANGE_DAYS,
  ),
  initialData = null,
  initialError = null,
}: {
  children: ReactNode;
  initialRange?: StatementRange;
  initialData?: PaymentHistorySnapshot | null;
  initialError?: string | null;
}) {
  return (
    <paymentsHistoryFeed.Provider
      initialRange={initialRange}
      initialData={initialData}
      initialError={initialError}
    >
      {children}
    </paymentsHistoryFeed.Provider>
  );
}

export function MonobankStatementProvider({
  children,
  initialRange = createDefaultStatementRange(),
  initialData = null,
  initialError = null,
}: {
  children: ReactNode;
  initialRange?: StatementRange;
  initialData?: MonobankStatementSnapshot | null;
  initialError?: string | null;
}) {
  return (
    <monobankStatementFeed.Provider
      initialRange={initialRange}
      initialData={initialData}
      initialError={initialError}
    >
      {children}
    </monobankStatementFeed.Provider>
  );
}

export function usePaymentsHistory() {
  return paymentsHistoryFeed.useFeed(
    "usePaymentsHistory",
    "PaymentsHistoryProvider",
  );
}

export function useMonobankStatement() {
  return monobankStatementFeed.useFeed(
    "useMonobankStatement",
    "MonobankStatementProvider",
  );
}

export function usePaymentsFeed(source: PaymentDetailsSource) {
  const paymentsHistory = useContext(paymentsHistoryFeed.Context);
  const monobankStatement = useContext(monobankStatementFeed.Context);
  const context = source === "database" ? paymentsHistory : monobankStatement;

  if (!context) {
    throw new Error(
      source === "database"
        ? "Database payment history must be used within a PaymentsHistoryProvider."
        : "Provider statement must be used within a MonobankStatementProvider.",
    );
  }

  return context;
}
