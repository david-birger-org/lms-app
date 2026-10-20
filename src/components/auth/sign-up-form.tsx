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

// Matches the minLength the form enforced before the redesign.
const MIN_PASSWORD_LENGTH = 8;

function buildAuthHref(path: string, redirectTo: string) {
  if (!redirectTo || redirectTo === "/") {
    return path;
  }

  const params = new URLSearchParams({ redirect_url: redirectTo });
  return `${path}?${params.toString()}`;
}

export function SignUpForm() {
  const t = useTranslations("auth.signUp");
  const tValidation = useTranslations("auth.validation");
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect_url")?.trim() || "/";
  const navigationTarget = stripLocalePrefix(redirectTo);
  const signInHref = useMemo(
    () => buildAuthHref("/sign-in", redirectTo),
    [redirectTo],
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    confirmPassword?: string;
    email?: string;
    password?: string;
  }>({});
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function clearFieldError(field: keyof typeof fieldErrors) {
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const emailErrorKey = getEmailErrorKey(email);
    const nextFieldErrors = {
      confirmPassword:
        password !== confirmPassword ? t("passwordMismatch") : undefined,
      email: emailErrorKey ? tValidation(emailErrorKey) : undefined,
      password: !password
        ? tValidation("passwordRequired")
        : password.length < MIN_PASSWORD_LENGTH
          ? tValidation("passwordTooShort", { min: MIN_PASSWORD_LENGTH })
          : undefined,
    };
    setFieldErrors(nextFieldErrors);
    const firstInvalid = (
      ["email", "password", "confirmPassword"] as const
    ).find((field) => nextFieldErrors[field]);
    if (firstInvalid) {
      document.getElementById(firstInvalid)?.focus();
      return;
    }

    setIsSubmitting(true);

    try {
      const derivedName = email.split("@")[0] || email;
      const { error: signUpError } = await authClient.signUp.email({
        callbackURL: navigationTarget,
        email,
        name: derivedName,
        password,
      });

      if (signUpError) {
        setError(signUpError.message || t("error"));
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
      footerHref={signInHref}
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
            clearFieldError("email");
          }}
          placeholder="name@example.com"
          required
          type="email"
          value={email}
        />
        <AuthField
          autoComplete="new-password"
          error={fieldErrors.password}
          hint={t("passwordHint", { min: MIN_PASSWORD_LENGTH })}
          id="password"
          label={t("password")}
          minLength={MIN_PASSWORD_LENGTH}
          onChange={(event) => {
            setPassword(event.target.value);
            clearFieldError("password");
          }}
          required
          type="password"
          value={password}
        />
        <AuthField
          autoComplete="new-password"
          error={fieldErrors.confirmPassword}
          id="confirmPassword"
          label={t("confirmPassword")}
          minLength={MIN_PASSWORD_LENGTH}
          onChange={(event) => {
            setConfirmPassword(event.target.value);
            clearFieldError("confirmPassword");
          }}
          required
          type="password"
          value={confirmPassword}
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
