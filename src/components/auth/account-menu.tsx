"use client";

import { LayoutDashboard, LogOut, Settings2 } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Link, useRouter } from "@/i18n/routing";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

const MENU_WIDTH = 256;
const MENU_GAP = 8;
const VIEWPORT_PADDING = 8;

function getInitials(name: string, email: string) {
  const source = name.trim() || email.trim();
  const parts = source.split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
  }

  return source.slice(0, 2).toUpperCase();
}

const itemClass =
  "flex w-full items-center gap-2.5 rounded-2xl px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0";

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
  const initials = useMemo(
    () => getInitials(fullName, email),
    [email, fullName],
  );
  const [open, setOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [position, setPosition] = useState<{ left: number; top: number } | null>(
    null,
  );
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    const menu = menuRef.current;
    if (!trigger) return;

    const triggerRect = trigger.getBoundingClientRect();
    const menuHeight = menu?.offsetHeight ?? 0;

    let left = triggerRect.right - MENU_WIDTH;
    if (left < VIEWPORT_PADDING) left = VIEWPORT_PADDING;
    if (left + MENU_WIDTH > window.innerWidth - VIEWPORT_PADDING) {
      left = window.innerWidth - MENU_WIDTH - VIEWPORT_PADDING;
    }

    let top = triggerRect.top - menuHeight - MENU_GAP;
    if (top < VIEWPORT_PADDING) {
      top = triggerRect.bottom + MENU_GAP;
    }

    setPosition({ left, top });
  }, []);

  useLayoutEffect(() => {
    if (!open) {
      setPosition(null);
      return;
    }

    updatePosition();

    function handleScrollOrResize() {
      updatePosition();
    }

    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);
    return () => {
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (triggerRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  async function handleSignOut() {
    setOpen(false);
    setIsSigningOut(true);
    await authClient.signOut();
    router.replace("/sign-in");
    router.refresh();
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex h-auto w-full items-center justify-start gap-3 rounded-lg border border-sidebar-border/70 bg-sidebar-accent/40 px-2 py-2 text-left text-sidebar-foreground outline-none transition hover:bg-sidebar-accent/60 focus-visible:ring-2 focus-visible:ring-ring/30 aria-expanded:bg-sidebar-accent/60"
      >
        <Avatar className="size-9 border border-sidebar-border/80 bg-sidebar-primary/10">
          <AvatarFallback className="bg-sidebar-primary/10 text-sidebar-foreground">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-sidebar-foreground">
            {fullName}
          </p>
          <p className="truncate text-xs text-sidebar-foreground/70">
            {email}
          </p>
        </div>
      </button>

      {mounted && open
        ? createPortal(
            <div
              ref={menuRef}
              role="menu"
              style={{
                position: "fixed",
                top: position?.top ?? -9999,
                left: position?.left ?? -9999,
                width: MENU_WIDTH,
                visibility: position ? "visible" : "hidden",
              }}
              className="z-[1000] flex flex-col gap-1 rounded-2xl border border-border bg-popover p-1.5 text-popover-foreground shadow-lg ring-1 ring-foreground/5"
            >
              <div className="space-y-0.5 px-3 py-2">
                <p className="truncate text-sm font-medium text-foreground">
                  {fullName}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {email}
                </p>
              </div>
              <div className="-mx-1.5 my-1 h-px bg-border/50" />
              {secondaryHref && secondaryLabel ? (
                <Link
                  href={secondaryHref}
                  className={itemClass}
                  role="menuitem"
                  onClick={() => setOpen(false)}
                >
                  <LayoutDashboard />
                  {secondaryLabel}
                </Link>
              ) : null}
              <Link
                href={settingsHref}
                className={itemClass}
                role="menuitem"
                onClick={() => setOpen(false)}
              >
                <Settings2 />
                {t("settings")}
              </Link>
              <button
                type="button"
                role="menuitem"
                disabled={isSigningOut}
                onClick={() => void handleSignOut()}
                className={cn(itemClass, "text-left")}
              >
                <LogOut />
                {isSigningOut ? t("signingOut") : t("signOut")}
              </button>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
