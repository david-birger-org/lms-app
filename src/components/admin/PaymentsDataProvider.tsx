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
import {
  DEFAULT_PAYMENT_HISTORY_DAYS,
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
  };
  meta: {
    days: number;
    lastFetchedAt: number | null;
  };
}

interface PaymentsFeedProviderProps {
  children: ReactNode;
  days: number;
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
  getUrl: (days: number) => string;
  normalizeRows: (rows: StatementItem[]) => StatementItem[];
  autoRefresh?: AutoRefreshOptions;
}

function createPaymentsFeed({
  errorMessage,
  getUrl,
  normalizeRows,
  autoRefresh,
}: CreatePaymentsFeedOptions) {
  const cache = new Map<number, PaymentsFeedSnapshot>();
  const requests = new Map<number, Promise<PaymentsFeedSnapshot>>();
  const Context = createContext<PaymentsFeedContextValue | null>(null);

  function getSeed(
    days: number,
    initialData?: PaymentsFeedSnapshot | null,
  ): PaymentsFeedSnapshot | null {
    const cachedSnapshot = cache.get(days);

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

  async function fetchFeed(days: number, forceRefresh = false) {
    const now = Date.now();
    const cachedSnapshot = cache.get(days);

    if (
      !forceRefresh &&
      cachedSnapshot &&
      now - cachedSnapshot.fetchedAt < 60_000
    ) {
      return cachedSnapshot;
    }

    const inflightRequest = requests.get(days);

    if (!forceRefresh && inflightRequest) {
      return inflightRequest;
    }

    const request = (async () => {
      const response = await fetch(getUrl(days), {
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

      cache.set(days, nextSnapshot);

      return nextSnapshot;
    })();

    requests.set(days, request);

    try {
      return await request;
    } finally {
      requests.delete(days);
    }
  }

  function Provider({
    children,
    days,
    initialData = null,
    initialError = null,
  }: PaymentsFeedProviderProps) {
    const seed = getSeed(days, initialData);
    const [rows, setRows] = useState<StatementItem[]>(seed?.rows ?? []);
    const [error, setError] = useState<string | null>(initialError);
    const [status, setStatus] = useState<PaymentsFeedStatus>(
      initialError ? "error" : seed ? "ready" : "loading",
    );
    const [lastFetchedAt, setLastFetchedAt] = useState<number | null>(
      seed?.fetchedAt ?? null,
    );

    const loadFeed = useCallback(
      async ({
        background = false,
        forceRefresh = false,
      }: LoadFeedOptions = {}) => {
        if (!background) {
          setStatus("loading");
          setError(null);
        }

        try {
          const nextSnapshot = await fetchFeed(days, forceRefresh);
          setRows(nextSnapshot.rows);
          setLastFetchedAt(nextSnapshot.fetchedAt);
          setStatus("ready");
        } catch (loadError) {
          const message =
            loadError instanceof Error ? loadError.message : errorMessage;
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

      const cachedSnapshot = cache.get(days);

      if (!cachedSnapshot || cachedSnapshot.fetchedAt < initialData.fetchedAt) {
        cache.set(days, initialData);
      }
    }, [days, initialData]);

    useEffect(() => {
      if (seed || initialError) {
        return;
      }

      void loadFeed();
    }, [initialError, loadFeed, seed]);

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
        },
        meta: {
          days,
          lastFetchedAt,
        },
      }),
      [days, error, lastFetchedAt, refresh, rows, status],
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
  getUrl: (days) => `/api/payments/history?days=${days}`,
  normalizeRows: normalizePaymentHistoryRows,
  autoRefresh: {
    intervalMs: 30_000,
    refreshOnFocus: true,
    refreshOnVisible: true,
  },
});

const monobankStatementFeed = createPaymentsFeed({
  errorMessage: "Failed to load statement",
  getUrl: (days) => `/api/monobank/statement?days=${days}`,
  normalizeRows: normalizeStatementRows,
});

export function PaymentsHistoryProvider({
  children,
  days = DEFAULT_PAYMENT_HISTORY_DAYS,
  initialData = null,
  initialError = null,
}: {
  children: ReactNode;
  days?: number;
  initialData?: PaymentHistorySnapshot | null;
  initialError?: string | null;
}) {
  return (
    <paymentsHistoryFeed.Provider
      days={days}
      initialData={initialData}
      initialError={initialError}
    >
      {children}
    </paymentsHistoryFeed.Provider>
  );
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
  return (
    <monobankStatementFeed.Provider
      days={days}
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
