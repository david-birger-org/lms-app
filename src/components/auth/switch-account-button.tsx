"use client";

import { Loader2, LogOut } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/routing";
import { authClient } from "@/lib/auth-client";

export function SwitchAccountButton() {
  const t = useTranslations("auth.switchAccount");
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleSignOut() {
    setIsSigningOut(true);
    await authClient.signOut();
    router.replace("/sign-in");
    router.refresh();
  }

  return (
    <Button
      aria-busy={isSigningOut || undefined}
      disabled={isSigningOut}
      onClick={() => void handleSignOut()}
      size="lg"
      type="button"
      variant="outline"
    >
      {isSigningOut ? (
        <Loader2 aria-hidden className="animate-spin" />
      ) : (
        <LogOut aria-hidden />
      )}
      {isSigningOut ? t("signingOut") : t("label")}
    </Button>
  );
}
