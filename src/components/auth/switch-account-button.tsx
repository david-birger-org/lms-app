"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export function SwitchAccountButton() {
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
      type="button"
      disabled={isSigningOut}
      onClick={() => void handleSignOut()}
    >
      <LogOut />
      {isSigningOut ? "Signing out..." : "Switch account"}
    </Button>
  );
}
