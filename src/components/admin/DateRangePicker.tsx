"use client";

import { CalendarIcon } from "lucide-react";
import { useState } from "react";
import type { DateRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { StatementRange } from "@/lib/monobank";
import { cn } from "@/lib/utils";

function rangeToDates(range: StatementRange): DateRange {
  return {
    from: new Date(range.from * 1000),
    to: new Date(range.to * 1000),
  };
}

function datesToRange(value: DateRange): StatementRange | null {
  if (!value.from || !value.to) return null;
  const from = Math.floor(
    new Date(
      value.from.getFullYear(),
      value.from.getMonth(),
      value.from.getDate(),
      0,
      0,
      0,
    ).getTime() / 1000,
  );
  const to = Math.floor(
    new Date(
      value.to.getFullYear(),
      value.to.getMonth(),
      value.to.getDate(),
      23,
      59,
      59,
    ).getTime() / 1000,
  );
  return { from, to };
}

function formatLabel(range: StatementRange) {
  const fromDate = new Date(range.from * 1000);
  const toDate = new Date(range.to * 1000);
  const formatter = new Intl.DateTimeFormat(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  return `${formatter.format(fromDate)} – ${formatter.format(toDate)}`;
}

export function DateRangePicker({
  range,
  onChange,
  className,
  disabled,
  maxDays,
}: {
  range: StatementRange;
  onChange: (range: StatementRange) => void;
  className?: string;
  disabled?: boolean;
  maxDays?: number;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<DateRange | undefined>(
    rangeToDates(range),
  );

  const draftRange = draft ? datesToRange(draft) : null;
  const draftDays = draftRange
    ? Math.round((draftRange.to - draftRange.from) / 86_400)
    : 0;
  const exceedsMax = maxDays !== undefined && draftDays > maxDays;

  function handleApply() {
    if (!draftRange || exceedsMax) return;
    onChange(draftRange);
    setOpen(false);
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (nextOpen) {
      setDraft(rangeToDates(range));
    }
  }

  function handleShortcut(days: number) {
    const today = new Date();
    const end = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );
    const start = new Date(end);
    start.setDate(start.getDate() - (days - 1));
    setDraft({ from: start, to: end });
  }

  const shortcuts = [
    { label: "30d", days: 30 },
    { label: "60d", days: 60 },
    { label: "90d", days: 90 },
  ];

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled}
          className={cn("h-9 justify-start gap-2 px-3 font-normal", className)}
        >
          <CalendarIcon />
          <span>{formatLabel(range)}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-auto min-w-(--radix-popover-trigger-width) p-0"
      >
        <div className="flex flex-wrap items-center gap-1.5 border-b p-3">
          {shortcuts.map((shortcut) => {
            const exceeds = maxDays !== undefined && shortcut.days > maxDays;
            return (
              <Button
                key={shortcut.days}
                variant="outline"
                size="sm"
                className="h-8 px-2.5"
                disabled={exceeds}
                onClick={() => handleShortcut(shortcut.days)}
              >
                {shortcut.label}
              </Button>
            );
          })}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2.5"
            onClick={() => handleShortcut(30)}
          >
            Reset
          </Button>
        </div>
        <Calendar
          mode="range"
          numberOfMonths={1}
          selected={draft}
          onSelect={setDraft}
          defaultMonth={draft?.from}
        />
        <div className="flex items-center justify-between gap-2 border-t p-3">
          <p className="text-muted-foreground text-xs">
            {exceedsMax
              ? `Max ${maxDays} days per request.`
              : draftRange
                ? `${draftDays} day${draftDays === 1 ? "" : "s"} selected`
                : "Select a start and end date."}
          </p>
          <Button
            size="sm"
            onClick={handleApply}
            disabled={!draftRange || exceedsMax}
          >
            Apply
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
