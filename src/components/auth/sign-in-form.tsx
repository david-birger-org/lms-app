"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

import { AuthCard } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

function buildAuthHref(path: string, redirectTo: string) {
  if (!redirectTo || redirectTo === "/") {
    return path;
  }

  const params = new URLSearchParams({ redirect_url: redirectTo });
  return `${path}?${params.toString()}`;
}

export function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect_url")?.trim() || "/";
  const signUpHref = useMemo(
    () => buildAuthHref("/sign-up", redirectTo),
    [redirectTo],
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const { error: signInError } = await authClient.signIn.email({
      callbackURL: redirectTo,
      email,
      password,
      rememberMe: true,
    });

    setIsSubmitting(false);

    if (signInError) {
      setError(signInError.message || "Failed to sign in.");
      return;
    }

    router.replace(redirectTo);
    router.refresh();
  }

  return (
    <AuthCard
      description="Sign in with your email and password to reach the protected operations workspace."
      footerHref={signUpHref}
      footerLabel="Create an account"
      footerText="Need access first?"
      title="Welcome back"
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            autoComplete="email"
            id="email"
            inputMode="email"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="name@example.com"
            required
            type="email"
            value={email}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            autoComplete="current-password"
            id="password"
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            value={password}
          />
          <p className="text-xs text-muted-foreground">
            You can update your password after signing in.
          </p>
        </div>
        {error ? (
          <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}
        <Button className="h-9 w-full" disabled={isSubmitting} type="submit">
          {isSubmitting ? "Signing in..." : "Sign in"}
        </Button>
      </form>
    </AuthCard>
  );
}
