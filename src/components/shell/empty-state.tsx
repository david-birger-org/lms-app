import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function EmptyState({
  action,
  className,
  description,
  icon: Icon,
  title,
}: {
  action?: ReactNode;
  className?: string;
  description?: ReactNode;
  icon?: LucideIcon;
  title: ReactNode;
}) {
  return (
    <div
      data-slot="empty-state"
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-6 py-12 text-center",
        className,
      )}
    >
      {Icon ? (
        <div className="flex size-10 items-center justify-center rounded-lg border bg-background text-muted-foreground shadow-card">
          <Icon className="size-5" strokeWidth={1.75} />
        </div>
      ) : null}
      <div className="flex max-w-sm flex-col gap-1">
        <p className="text-sm font-medium">{title}</p>
        {description ? (
          <p className="text-sm text-pretty text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}
