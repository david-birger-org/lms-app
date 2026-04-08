"use client";

import {
  eachDayOfInterval,
  endOfDay,
  format,
  isAfter,
  isBefore,
  parseISO,
  startOfDay,
  subDays,
} from "date-fns";
import { RefreshCw, TrendingUp } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, ReferenceLine, XAxis } from "recharts";

import { usePaymentsHistory } from "@/components/admin/PaymentsDataProvider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { StatementItem } from "@/lib/monobank";
import { isSuccessfulPaymentStatus } from "@/lib/payments";

const dayOptions = [30, 60, 90] as const;
const chartModes = ["total", "daily"] as const;

function getIntlLocale(locale: string) {
  return locale === "ua" ? "uk-UA" : "en-US";
}

function formatMetricValue(value: number, locale: string) {
  return new Intl.NumberFormat(getIntlLocale(locale), {
    maximumFractionDigits: 0,
  }).format(value);
}

function aggregatePaymentRows(rows: StatementItem[], days: number) {
  const today = startOfDay(new Date());
  const from = startOfDay(subDays(today, days - 1));

  const dailyTotals = new Map<string, { volume: number; count: number }>();
  let totalPayments = 0;
  let paidPayments = 0;

  for (const row of rows) {
    if (!row.date) {
      continue;
    }

    const parsedDate = parseISO(row.date);
    if (Number.isNaN(parsedDate.getTime())) {
      continue;
    }

    if (isBefore(parsedDate, from) || isAfter(parsedDate, endOfDay(today))) {
      continue;
    }

    totalPayments += 1;

    if (!isSuccessfulPaymentStatus(row.status)) {
      continue;
    }

    const key = format(parsedDate, "yyyy-MM-dd");
    const entry = dailyTotals.get(key) ?? { volume: 0, count: 0 };
    entry.volume += Math.max((row.amount ?? 0) / 100, 0);
    entry.count += 1;
    dailyTotals.set(key, entry);
    paidPayments += 1;
  }

  let cumulativeVolume = 0;
  const series = eachDayOfInterval({ start: from, end: today }).map((date) => {
    const key = format(date, "yyyy-MM-dd");
    const entry = dailyTotals.get(key) ?? { volume: 0, count: 0 };

    cumulativeVolume += entry.volume;

    return {
      date: format(date, "MMM d"),
      dailyVolume: Number(entry.volume.toFixed(2)),
      dailyCount: entry.count,
      totalVolume: Number(cumulativeVolume.toFixed(2)),
    };
  });

  return {
    series,
    totals: {
      paidPayments,
      payments: totalPayments,
      volume: series.at(-1)?.totalVolume ?? 0,
    },
  };
}

export function PaymentsChart() {
  const [selectedRange, setSelectedRange] =
    useState<(typeof dayOptions)[number]>(90);
  const [chartMode, setChartMode] =
    useState<(typeof chartModes)[number]>("total");
  const { state, actions, meta } = usePaymentsHistory();
  const t = useTranslations("admin.paymentsChart");
  const locale = useLocale();
  const intlLocale = getIntlLocale(locale);
  const chartConfig = {
    totalVolume: {
      label: t("tooltip.totalPaidVolume"),
      color: "var(--primary)",
    },
    dailyVolume: {
      label: t("tooltip.dailyPaidVolume"),
      color: "var(--color-chart-2)",
    },
  } satisfies ChartConfig;

  const chartState = useMemo(
    () => aggregatePaymentRows(state.rows, selectedRange),
    [selectedRange, state.rows],
  );

  const chartData = chartState.series;
  const totals = chartState.totals;

  const hasChartActivity =
    chartMode === "total"
      ? totals.volume > 0
      : chartData.some((item) => item.dailyVolume > 0 || item.dailyCount > 0);

  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => {
    setHasMounted(true);
  }, []);

  const lastUpdated =
    hasMounted && meta.lastFetchedAt
      ? new Intl.DateTimeFormat(intlLocale, {
          hour: "numeric",
          minute: "2-digit",
          month: "short",
          day: "numeric",
        }).format(new Date(meta.lastFetchedAt))
      : t("notSyncedYet");

  return (
    <Card className="shadow-xs">
      <CardHeader className="border-b">
        <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="size-4" />
                {t("title")}
              </CardTitle>
              <Badge variant="outline">{t("badge")}</Badge>
            </div>
            <CardDescription>
              {chartMode === "total"
                ? t("descriptionTotal")
                : t("descriptionDaily")}
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2 lg:justify-end">
            <ToggleGroup
              value={[chartMode]}
              onValueChange={(value) => {
                const v = value[0];
                if (v === "total" || v === "daily") {
                  setChartMode(v);
                }
              }}
              variant="outline"
              size="sm"
            >
              <ToggleGroupItem value="total">
                {t("modes.total")}
              </ToggleGroupItem>
              <ToggleGroupItem value="daily">
                {t("modes.daily")}
              </ToggleGroupItem>
            </ToggleGroup>
            <ToggleGroup
              value={[String(selectedRange)]}
              onValueChange={(value) => {
                const v = value[0];
                if (v) {
                  setSelectedRange(Number(v) as (typeof dayOptions)[number]);
                }
              }}
              variant="outline"
              size="sm"
            >
              {dayOptions.map((days) => (
                <ToggleGroupItem key={days} value={String(days)}>
                  {t("days", { days })}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void actions.refresh()}
              disabled={state.isLoading}
            >
              <RefreshCw
                className={state.isLoading ? "animate-spin" : undefined}
              />
              {t("refresh")}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-4 sm:space-y-6">
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <div className="rounded-lg border bg-muted/20 p-2.5 sm:p-3">
            <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground sm:text-xs">
              {t("stats.volume")}
            </p>
            <p className="mt-1.5 text-lg font-semibold tabular-nums sm:mt-2 sm:text-2xl">
              {formatMetricValue(totals.volume, locale)}
            </p>
          </div>
          <div className="rounded-lg border bg-muted/20 p-2.5 sm:p-3">
            <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground sm:text-xs">
              {t("stats.paid")}
            </p>
            <p className="mt-1.5 text-lg font-semibold tabular-nums sm:mt-2 sm:text-2xl">
              {totals.paidPayments}
            </p>
          </div>
          <div className="rounded-lg border bg-muted/20 p-2.5 sm:p-3">
            <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground sm:text-xs">
              {t("stats.payments")}
            </p>
            <p className="mt-1.5 text-lg font-semibold tabular-nums sm:mt-2 sm:text-2xl">
              {totals.payments}
            </p>
          </div>
        </div>

        {state.error && chartData.length === 0 ? (
          <div className="flex min-h-56 items-center justify-center rounded-lg border border-dashed text-sm text-destructive sm:min-h-72">
            {state.error}
          </div>
        ) : !hasChartActivity && !state.isLoading ? (
          <div className="flex min-h-56 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground sm:min-h-72">
            {chartMode === "total" ? t("empty.total") : t("empty.daily")}
          </div>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[220px] min-w-0 w-full sm:h-[320px]"
          >
            {chartMode === "total" ? (
              <LineChart
                accessibilityLayer
                data={chartData}
                margin={{ left: 12, right: 12 }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={18}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="line" />}
                />
                <Line
                  dataKey="totalVolume"
                  type="linear"
                  stroke="var(--color-totalVolume)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            ) : (
              <LineChart
                accessibilityLayer
                data={chartData}
                margin={{ left: 12, right: 12 }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={18}
                />
                <ReferenceLine y={0} stroke="hsl(var(--border))" />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="line" />}
                />
                <Line
                  dataKey="dailyVolume"
                  type="linear"
                  stroke="var(--color-dailyVolume)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            )}
          </ChartContainer>
        )}

        <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground sm:text-xs">
          <Badge variant="outline">
            {t("lastUpdated", { value: lastUpdated })}
          </Badge>
          {state.error ? (
            <Badge variant="secondary">{t("staleData")}</Badge>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
