"use client";

import { LayoutDashboard, LogOut, Settings2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { ThemeMenuItems } from "@/components/shell/theme-picker";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link, useRouter } from "@/i18n/routing";
import { authClient } from "@/lib/auth-client";

function getInitials(name: string, email: string) {
  const source = name.trim() || email.trim();
  const parts = source.split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
  }

  return source.slice(0, 2).toUpperCase();
}

export function AccountMenu({
  email,
  fullName,
  settingsHref,
  secondaryHref,
  secondaryLabel,
}: {
  email: string;
  fullName: string;
  settingsHref: string;
  secondaryHref?: string;
  secondaryLabel?: string;
}) {
  const t = useTranslations("auth.accountMenu");
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleSignOut() {
    setIsSigningOut(true);
    await authClient.signOut();
    router.replace("/sign-in");
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={t("open")}
          className="press flex rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <Avatar className="size-8 border">
            <AvatarFallback className="bg-muted text-xs font-medium">
              {getInitials(fullName, email)}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="flex flex-col gap-0.5 font-normal">
          <span className="truncate text-sm font-medium text-foreground">
            {fullName}
          </span>
          <span className="truncate text-xs text-muted-foreground">
            {email}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {secondaryHref && secondaryLabel ? (
            <DropdownMenuItem asChild>
              <Link href={secondaryHref}>
                <LayoutDashboard />
                {secondaryLabel}
              </Link>
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuItem asChild>
            <Link href={settingsHref}>
              <Settings2 />
              {t("settings")}
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <ThemeMenuItems />
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={isSigningOut}
          onSelect={(event) => {
            event.preventDefault();
            void handleSignOut();
          }}
        >
          <LogOut />
          {isSigningOut ? t("signingOut") : t("signOut")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
