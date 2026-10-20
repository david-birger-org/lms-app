import type { ComponentProps, ReactNode } from "react";

import { PublicPage } from "@/components/auth/public-page";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "@/i18n/routing";

/** Vercel-style auth column: a large title, the form, then a quiet link. */
export function AuthCard({
  children,
  description,
  footerHref,
  footerLabel,
  footerText,
  title,
}: {
  children: ReactNode;
  description: string;
  footerHref: string;
  footerLabel: string;
  footerText: string;
  title: string;
}) {
  return (
    <PublicPage>
      <div className="stagger flex w-full max-w-sm flex-col gap-8">
        <div className="flex flex-col gap-2 text-center">
          <h1 className="text-[2rem] leading-10 font-semibold tracking-tight text-balance">
            {title}
          </h1>
          <p className="text-sm text-pretty text-muted-foreground">
            {description}
          </p>
        </div>
        {children}
        <p className="border-t pt-6 text-center text-sm text-muted-foreground">
          {footerText}{" "}
          <Link
            className="rounded-sm font-medium text-foreground underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
            href={footerHref}
          >
            {footerLabel}
          </Link>
        </p>
      </div>
    </PublicPage>
  );
}

/** Returns an `auth.validation` message key, or undefined when the email is fine. */
export function getEmailErrorKey(email: string) {
  if (!email.trim()) return "emailRequired" as const;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
    return "emailInvalid" as const;
  return undefined;
}

/** Label, a 40px input, and a hint or an inline error under it. */
export function AuthField({
  error,
  hint,
  id,
  label,
  ...inputProps
}: Omit<ComponentProps<typeof Input>, "id"> & {
  error?: string;
  hint?: string;
  id: string;
  label: string;
}) {
  const messageId = `${id}-message`;
  const message = error ?? hint;

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        aria-describedby={message ? messageId : undefined}
        aria-invalid={error ? true : undefined}
        className="h-10"
        id={id}
        {...inputProps}
      />
      {message ? (
        <p
          className={
            error
              ? "text-[0.8125rem] text-destructive"
              : "text-[0.8125rem] text-muted-foreground"
          }
          id={messageId}
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
