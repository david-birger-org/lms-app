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
import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";

import { useMonobankStatement } from "@/components/admin/MonobankStatementProvider";
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

const dayOptions = [30, 60, 90] as const;

const chartConfig = {
  volume: {
    label: "Volume",
    color: "var(--primary)",
  },
  profit: {
    label: "Profit",
    color: "var(--color-chart-2)",
  },
} satisfies ChartConfig;

function formatMetricValue(value: number) {
  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 0,
  }).format(value);
}

function aggregateStatementRows(rows: StatementItem[], days: number) {
  const today = startOfDay(new Date());
  const from = startOfDay(subDays(today, days - 1));

  const dailyTotals = new Map<
    string,
    { volume: number; profit: number; count: number }
  >();

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

    const key = format(parsedDate, "yyyy-MM-dd");
    const entry = dailyTotals.get(key) ?? { volume: 0, profit: 0, count: 0 };
    entry.volume += (row.amount ?? 0) / 100;
    entry.profit += (row.profitAmount ?? 0) / 100;
    entry.count += 1;
    dailyTotals.set(key, entry);
  }

  return eachDayOfInterval({ start: from, end: today }).map((date) => {
    const key = format(date, "yyyy-MM-dd");
    const entry = dailyTotals.get(key) ?? { volume: 0, profit: 0, count: 0 };

    return {
      date: format(date, "MMM d"),
      volume: Number(entry.volume.toFixed(2)),
      profit: Number(entry.profit.toFixed(2)),
      count: entry.count,
    };
  });
}

export function PaymentsChart() {
  const [selectedRange, setSelectedRange] =
    useState<(typeof dayOptions)[number]>(90);
  const { state, actions, meta } = useMonobankStatement();

  const chartData = useMemo(
    () => aggregateStatementRows(state.rows, selectedRange),
    [selectedRange, state.rows],
  );

  const totals = useMemo(
    () =>
      chartData.reduce(
        (accumulator, item) => ({
          volume: accumulator.volume + item.volume,
          profit: accumulator.profit + item.profit,
          payments: accumulator.payments + item.count,
        }),
        {
          volume: 0,
          profit: 0,
          payments: 0,
        },
      ),
    [chartData],
  );

  const lastUpdated = meta.lastFetchedAt
    ? new Intl.DateTimeFormat(undefined, {
        hour: "numeric",
        minute: "2-digit",
        month: "short",
        day: "numeric",
      }).format(new Date(meta.lastFetchedAt))
    : "Not synced yet";

  return (
    <Card className="shadow-xs">
      <CardHeader className="border-b">
        <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="size-4" />
                Payment Trends
              </CardTitle>
              <Badge variant="outline">{meta.days}-day sync</Badge>
            </div>
            <CardDescription>
              Statement volume and realized profit mapped from the Monobank
              feed.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2 lg:justify-end">
            <ToggleGroup
              type="single"
              value={String(selectedRange)}
              onValueChange={(value) => {
                if (value) {
                  setSelectedRange(
                    Number(value) as (typeof dayOptions)[number],
                  );
                }
              }}
              variant="outline"
              size="sm"
            >
              {dayOptions.map((days) => (
                <ToggleGroupItem key={days} value={String(days)}>
                  {days}d
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
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-4 sm:space-y-6">
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <div className="rounded-lg border bg-muted/20 p-2.5 sm:p-3">
            <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground sm:text-xs">
              Volume
            </p>
            <p className="mt-1.5 text-lg font-semibold tabular-nums sm:mt-2 sm:text-2xl">
              {formatMetricValue(totals.volume)}
            </p>
          </div>
          <div className="rounded-lg border bg-muted/20 p-2.5 sm:p-3">
            <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground sm:text-xs">
              Profit
            </p>
            <p className="mt-1.5 text-lg font-semibold tabular-nums sm:mt-2 sm:text-2xl">
              {formatMetricValue(totals.profit)}
            </p>
          </div>
          <div className="rounded-lg border bg-muted/20 p-2.5 sm:p-3">
            <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground sm:text-xs">
              Payments
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
        ) : chartData.every((item) => item.volume === 0 && item.profit === 0) &&
          !state.isLoading ? (
          <div className="flex min-h-56 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground sm:min-h-72">
            No statement activity available for the selected range.
          </div>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[220px] w-full sm:h-[320px]"
          >
            <AreaChart
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
              <Area
                dataKey="profit"
                type="natural"
                fill="var(--color-profit)"
                fillOpacity={0.18}
                stroke="var(--color-profit)"
              />
              <Area
                dataKey="volume"
                type="natural"
                fill="var(--color-volume)"
                fillOpacity={0.12}
                stroke="var(--color-volume)"
              />
            </AreaChart>
          </ChartContainer>
        )}

        <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground sm:text-xs">
          <Badge variant="outline">Last updated {lastUpdated}</Badge>
          {state.error ? (
            <Badge variant="secondary">Using last available data</Badge>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
