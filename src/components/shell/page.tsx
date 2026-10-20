import type { CSSProperties, ReactNode } from "react";

import { cn } from "@/lib/utils";

const pageWidths = {
  default: "max-w-6xl",
  wide: "max-w-[1400px]",
  narrow: "max-w-3xl",
} as const;

export type PageWidth = keyof typeof pageWidths;

/**
 * Page container. Direct children enter one after another, 100ms apart, so
 * put the PageHeader first and each Section after it.
 */
export function Page({
  children,
  className,
  width = "default",
}: {
  children: ReactNode;
  className?: string;
  width?: PageWidth;
}) {
  return (
    <div
      data-slot="page"
      className={cn(
        "stagger mx-auto flex w-full flex-1 flex-col gap-6 px-4 py-6 md:gap-8 md:px-6 md:py-8",
        pageWidths[width],
        className,
      )}
    >
      {children}
    </div>
  );
}

function enterIndex(index: number) {
  return { "--enter-index": index } as CSSProperties;
}

/** Title, description and actions. Stacks on mobile, one row from md. */
export function PageHeader({
  actions,
  className,
  description,
  title,
}: {
  actions?: ReactNode;
  className?: string;
  description?: ReactNode;
  title: ReactNode;
}) {
  return (
    <header
      data-slot="page-header"
      className={cn(
        "flex flex-col gap-4 md:flex-row md:items-end md:justify-between",
        className,
      )}
    >
      <div className="flex min-w-0 flex-col gap-1.5">
        <h1 className="animate-enter text-2xl font-semibold tracking-tight text-balance md:text-[2rem] md:leading-10">
          {title}
        </h1>
        {description ? (
          <p
            className="animate-enter max-w-2xl text-sm text-pretty text-muted-foreground md:text-base"
            style={enterIndex(1)}
          >
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div
          className="animate-enter flex flex-wrap items-center gap-2 md:shrink-0"
          style={enterIndex(2)}
        >
          {actions}
        </div>
      ) : null}
    </header>
  );
}

/** A block of page content with an optional heading row. */
export function Section({
  actions,
  children,
  className,
  description,
  title,
}: {
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
  description?: ReactNode;
  title?: ReactNode;
}) {
  return (
    <section
      data-slot="section"
      className={cn("flex min-w-0 flex-col gap-4", className)}
    >
      {title || description || actions ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex min-w-0 flex-col gap-1">
            {title ? (
              <h2 className="text-base font-semibold tracking-tight">
                {title}
              </h2>
            ) : null}
            {description ? (
              <p className="text-sm text-pretty text-muted-foreground">
                {description}
              </p>
            ) : null}
          </div>
          {actions ? (
            <div className="flex flex-wrap items-center gap-2">{actions}</div>
          ) : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}
