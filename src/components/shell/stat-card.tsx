import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/** A metric tile. `value` renders in mono with tabular figures. */
export function StatCard({
  badge,
  className,
  hint,
  icon: Icon,
  label,
  value,
}: {
  badge?: ReactNode;
  className?: string;
  hint?: ReactNode;
  icon?: LucideIcon;
  label: ReactNode;
  value: ReactNode;
}) {
  return (
    <div
      data-slot="stat-card"
      className={cn(
        "flex min-w-0 flex-col gap-2 rounded-xl border bg-card p-4 text-card-foreground shadow-card sm:p-5",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-sm text-muted-foreground">{label}</span>
        {badge ??
          (Icon ? (
            <Icon className="size-4 shrink-0 text-muted-foreground" />
          ) : null)}
      </div>
      <div className="font-numeric truncate text-2xl font-semibold tracking-tight sm:text-3xl">
        {value}
      </div>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
