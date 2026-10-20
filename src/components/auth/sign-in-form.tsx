"use client";

import { Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import {
  AuthCard,
  AuthField,
  getEmailErrorKey,
} from "@/components/auth/auth-card";
import { FormAlert } from "@/components/auth/public-page";
import { Button } from "@/components/ui/button";
import { stripLocalePrefix } from "@/i18n/locale";
import { useRouter } from "@/i18n/routing";
import { authClient } from "@/lib/auth-client";

function buildAuthHref(path: string, redirectTo: string) {
  if (!redirectTo || redirectTo === "/") {
    return path;
  }

  const params = new URLSearchParams({ redirect_url: redirectTo });
  return `${path}?${params.toString()}`;
}

export function SignInForm() {
  const t = useTranslations("auth.signIn");
  const tValidation = useTranslations("auth.validation");
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect_url")?.trim() || "/";
  const navigationTarget = stripLocalePrefix(redirectTo);
  const signUpHref = useMemo(
    () => buildAuthHref("/sign-up", redirectTo),
    [redirectTo],
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
  }>({});
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const emailErrorKey = getEmailErrorKey(email);
    const nextFieldErrors = {
      email: emailErrorKey ? tValidation(emailErrorKey) : undefined,
      password: password ? undefined : tValidation("passwordRequired"),
    };
    setFieldErrors(nextFieldErrors);
    const firstInvalid = nextFieldErrors.email
      ? "email"
      : nextFieldErrors.password
        ? "password"
        : null;
    if (firstInvalid) {
      document.getElementById(firstInvalid)?.focus();
      return;
    }

    setIsSubmitting(true);

    try {
      const { error: signInError } = await authClient.signIn.email({
        callbackURL: navigationTarget,
        email,
        password,
        rememberMe: true,
      });

      if (signInError) {
        setError(signInError.message || t("error"));
        return;
      }

      router.replace(navigationTarget);
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : t("error"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthCard
      description={t("description")}
      footerHref={signUpHref}
      footerLabel={t("footerLabel")}
      footerText={t("footerText")}
      title={t("title")}
    >
      <form className="flex flex-col gap-5" noValidate onSubmit={handleSubmit}>
        <AuthField
          autoComplete="email"
          error={fieldErrors.email}
          id="email"
          inputMode="email"
          label={t("email")}
          onChange={(event) => {
            setEmail(event.target.value);
            setFieldErrors((current) => ({ ...current, email: undefined }));
          }}
          placeholder="name@example.com"
          required
          type="email"
          value={email}
        />
        <AuthField
          autoComplete="current-password"
          error={fieldErrors.password}
          hint={t("passwordHint")}
          id="password"
          label={t("password")}
          onChange={(event) => {
            setPassword(event.target.value);
            setFieldErrors((current) => ({ ...current, password: undefined }));
          }}
          required
          type="password"
          value={password}
        />
        {error ? <FormAlert>{error}</FormAlert> : null}
        <Button
          aria-busy={isSubmitting || undefined}
          className="w-full"
          disabled={isSubmitting}
          size="lg"
          type="submit"
        >
          {isSubmitting ? (
            <Loader2 aria-hidden className="animate-spin" />
          ) : null}
          {isSubmitting ? t("submitting") : t("submit")}
        </Button>
      </form>
    </AuthCard>
  );
}
