"use client";

import { useClerk } from "@clerk/nextjs";
import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";

export function SwitchAccountButton() {
  const { signOut } = useClerk();

  return (
    <Button
      type="button"
      onClick={() => void signOut({ redirectUrl: "/sign-in" })}
    >
      <LogOut />
      Switch account
    </Button>
  );
}
