"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { DropdownMenu as DropdownMenuPrimitive } from "radix-ui";
import { type CSSProperties, useState } from "react";

import { ACCENT_COOKIE, type Accent, accents, parseAccent } from "@/lib/theme";
import { cn } from "@/lib/utils";

const modes = [
  { value: "light", icon: Sun },
  { value: "dark", icon: Moon },
  { value: "system", icon: Monitor },
] as const;

// Same trick next-themes uses for disableTransitionOnChange: switch colors
// with transitions off, flush styles, then restore after the next frame.
function withoutTransitions(change: () => void) {
  const style = document.createElement("style");
  style.append(
    document.createTextNode("*,*::before,*::after{transition:none!important}"),
  );
  document.head.append(style);
  change();
  void document.body.offsetHeight;
  requestAnimationFrame(() => requestAnimationFrame(() => style.remove()));
}

function useAccent() {
  const [accent, setAccentState] = useState<Accent>(() =>
    typeof document === "undefined"
      ? "neutral"
      : parseAccent(document.documentElement.dataset.accent),
  );

  function setAccent(next: Accent) {
    setAccentState(next);
    withoutTransitions(() => {
      const root = document.documentElement;
      if (next === "neutral") delete root.dataset.accent;
      else root.dataset.accent = next;
    });
    // biome-ignore lint/suspicious/noDocumentCookie: one non-sensitive preference cookie, read by the root layout.
    document.cookie = `${ACCENT_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
  }

  return [accent, setAccent] as const;
}

const swatchColor: Record<Accent, string> = {
  neutral: "var(--gray-1000)",
  blue: "var(--tint-blue)",
  violet: "var(--tint-violet)",
  green: "var(--tint-green)",
  amber: "var(--tint-amber)",
};

const rowClass =
  "flex items-center justify-between gap-3 px-2 py-1.5 text-sm text-foreground";

/** Mode and accent controls. Render inside a DropdownMenuContent. */
export function ThemeMenuItems() {
  const t = useTranslations("theme");
  const { theme = "system", setTheme } = useTheme();
  const [accent, setAccent] = useAccent();

  return (
    <>
      <div className={rowClass}>
        <span>{t("label")}</span>
        <DropdownMenuPrimitive.RadioGroup
          value={theme}
          onValueChange={setTheme}
          className="flex items-center gap-0.5 rounded-full border p-0.5"
        >
          {modes.map(({ value, icon: Icon }) => (
            <DropdownMenuPrimitive.RadioItem
              key={value}
              value={value}
              aria-label={t(`modes.${value}`)}
              title={t(`modes.${value}`)}
              onSelect={(event) => event.preventDefault()}
              className="flex size-6 items-center justify-center rounded-full text-muted-foreground outline-none transition-[color,background-color] duration-150 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 data-[state=checked]:bg-muted data-[state=checked]:text-foreground"
            >
              <Icon className="size-3.5" />
            </DropdownMenuPrimitive.RadioItem>
          ))}
        </DropdownMenuPrimitive.RadioGroup>
      </div>
      <div className={rowClass}>
        <span>{t("accentLabel")}</span>
        <DropdownMenuPrimitive.RadioGroup
          value={accent}
          onValueChange={(value) => setAccent(parseAccent(value))}
          className="flex items-center gap-1"
        >
          {accents.map((value) => (
            <DropdownMenuPrimitive.RadioItem
              key={value}
              value={value}
              aria-label={t(`accents.${value}`)}
              title={t(`accents.${value}`)}
              onSelect={(event) => event.preventDefault()}
              style={{ "--swatch": swatchColor[value] } as CSSProperties}
              className={cn(
                "flex size-6 items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                "after:size-3.5 after:rounded-full after:bg-(--swatch) after:content-['']",
                "data-[state=checked]:shadow-[inset_0_0_0_1.5px_var(--swatch)]",
              )}
            />
          ))}
        </DropdownMenuPrimitive.RadioGroup>
      </div>
    </>
  );
}
