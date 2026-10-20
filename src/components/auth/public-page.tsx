import { CircleAlert, type LucideIcon } from "lucide-react";
import { type ReactNode, Suspense } from "react";

import { LanguageSwitcherClient } from "@/components/layout/language-switcher-client";
import { Logo } from "@/components/shell/logo";
import { cn } from "@/lib/utils";

/**
 * Full-page frame for pages outside the app shells: sign-in, sign-up,
 * checkout and the error states. A slim top bar, then centered content. On
 * mobile the content starts near the top so a form stays above the keyboard.
 */
export function PublicPage({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="flex h-14 shrink-0 items-center justify-between gap-4 px-4 md:px-6">
        <div className="flex items-center gap-2">
          <Logo />
          <span className="text-sm font-semibold tracking-tight">
            David Birger
          </span>
        </div>
        <Suspense fallback={null}>
          <LanguageSwitcherClient />
        </Suspense>
      </header>
      <main
        className={cn(
          "flex flex-1 flex-col items-center gap-6 px-4 pt-8 pb-16 sm:justify-center sm:pt-4 sm:pb-24",
          className,
        )}
      >
        {children}
      </main>
    </div>
  );
}

/** An error message with an icon, announced to screen readers. */
export function FormAlert({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive",
        className,
      )}
    >
      <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
      <p className="min-w-0 text-pretty">{children}</p>
    </div>
  );
}

/**
 * A calm full-page state (not found, error, no access): icon, an optional
 * mono code, a title, a description and the way back.
 */
export function PageState({
  actions,
  code,
  description,
  icon: Icon,
  title,
}: {
  actions?: ReactNode;
  code?: ReactNode;
  description?: ReactNode;
  icon: LucideIcon;
  title: ReactNode;
}) {
  return (
    <div className="stagger flex w-full max-w-md flex-col items-center gap-6 text-center">
      <div className="flex size-12 items-center justify-center rounded-xl border bg-background text-muted-foreground shadow-card">
        <Icon aria-hidden className="size-5" strokeWidth={1.75} />
      </div>
      <div className="flex flex-col gap-2">
        {code ? (
          <p className="font-numeric text-xs text-muted-foreground">{code}</p>
        ) : null}
        <h1 className="text-2xl font-semibold tracking-tight text-balance">
          {title}
        </h1>
        {description ? (
          <p className="text-sm text-pretty text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:justify-center">
          {actions}
        </div>
      ) : null}
    </div>
  );
}
