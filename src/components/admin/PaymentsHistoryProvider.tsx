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
import type { StatementItem } from "@/lib/monobank";
import {
  DEFAULT_PAYMENT_HISTORY_DAYS,
  normalizePaymentHistoryRows,
  type PaymentHistorySnapshot,
} from "@/lib/payments";

const PAYMENT_HISTORY_CACHE_TTL_MS = 60_000;

interface PaymentHistoryResponse {
  list?: StatementItem[];
  error?: string;
}

interface PaymentsHistoryContextValue {
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

interface LoadHistoryOptions {
  background?: boolean;
  forceRefresh?: boolean;
}

const paymentsHistoryCache = new Map<number, PaymentHistorySnapshot>();
const paymentsHistoryRequests = new Map<
  number,
  Promise<PaymentHistorySnapshot>
>();

const PaymentsHistoryContext =
  createContext<PaymentsHistoryContextValue | null>(null);

function getHistorySeed(
  days: number,
  initialData?: PaymentHistorySnapshot | null,
) {
  const cachedHistory = paymentsHistoryCache.get(days);

  if (!cachedHistory) {
    return initialData ?? null;
  }

  if (!initialData) {
    return cachedHistory;
  }

  return cachedHistory.fetchedAt >= initialData.fetchedAt
    ? cachedHistory
    : initialData;
}

async function fetchPaymentsHistory(days: number, forceRefresh = false) {
  const now = Date.now();
  const cached = paymentsHistoryCache.get(days);

  if (
    !forceRefresh &&
    cached &&
    now - cached.fetchedAt < PAYMENT_HISTORY_CACHE_TTL_MS
  ) {
    return cached;
  }

  const inflightRequest = paymentsHistoryRequests.get(days);
  if (!forceRefresh && inflightRequest) {
    return inflightRequest;
  }

  const request = (async () => {
    const response = await fetch(`/api/payments/history?days=${days}`, {
      method: "GET",
      cache: "no-store",
    });

    const payload = (await response.json()) as PaymentHistoryResponse;

    if (!response.ok) {
      throw new Error(payload.error ?? "Failed to load payment history");
    }

    const rows = normalizePaymentHistoryRows(
      Array.isArray(payload.list) ? payload.list : [],
    );

    const nextCache: PaymentHistorySnapshot = {
      rows,
      fetchedAt: Date.now(),
    };

    paymentsHistoryCache.set(days, nextCache);

    return nextCache;
  })();

  paymentsHistoryRequests.set(days, request);

  try {
    return await request;
  } finally {
    paymentsHistoryRequests.delete(days);
  }
}

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
  const seed = getHistorySeed(days, initialData);
  const [rows, setRows] = useState<StatementItem[]>(seed?.rows ?? []);
  const [error, setError] = useState<string | null>(initialError);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    initialError ? "error" : seed ? "ready" : "loading",
  );
  const [lastFetchedAt, setLastFetchedAt] = useState<number | null>(
    seed?.fetchedAt ?? null,
  );

  const loadHistory = useCallback(
    async ({
      background = false,
      forceRefresh = false,
    }: LoadHistoryOptions = {}) => {
      if (!background) {
        setStatus("loading");
        setError(null);
      }

      try {
        const nextHistory = await fetchPaymentsHistory(days, forceRefresh);
        setRows(nextHistory.rows);
        setLastFetchedAt(nextHistory.fetchedAt);
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

    const cachedHistory = paymentsHistoryCache.get(days);

    if (!cachedHistory || cachedHistory.fetchedAt < initialData.fetchedAt) {
      paymentsHistoryCache.set(days, initialData);
    }
  }, [days, initialData]);

  useEffect(() => {
    if (seed || initialError) {
      return;
    }

    void loadHistory();
  }, [initialError, loadHistory, seed]);

  useEffect(() => {
    function refreshWhenVisible() {
      if (document.visibilityState === "visible") {
        void loadHistory({ background: true, forceRefresh: true });
      }
    }

    function refreshOnFocus() {
      void loadHistory({ background: true, forceRefresh: true });
    }

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void loadHistory({ background: true, forceRefresh: true });
      }
    }, 30_000);

    window.addEventListener("focus", refreshOnFocus);
    document.addEventListener("visibilitychange", refreshWhenVisible);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", refreshOnFocus);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [loadHistory]);

  const refresh = useCallback(async () => {
    await loadHistory({ forceRefresh: true });
  }, [loadHistory]);

  const value = useMemo<PaymentsHistoryContextValue>(
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
    <PaymentsHistoryContext.Provider value={value}>
      {children}
    </PaymentsHistoryContext.Provider>
  );
}

export function usePaymentsHistory() {
  const context = useContext(PaymentsHistoryContext);

  if (!context) {
    throw new Error(
      "usePaymentsHistory must be used within a PaymentsHistoryProvider.",
    );
  }

  return context;
}
