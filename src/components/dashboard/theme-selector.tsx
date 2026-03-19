"use client";

import { Check, ChevronDown, Palette } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const STORAGE_KEY = "dashboard-theme-preset";
const DEFAULT_THEME = "theme-default";

const themeOptions = [
  { value: "theme-default", label: "Neutral" },
  { value: "theme-blue", label: "Blue" },
  { value: "theme-green", label: "Green" },
  { value: "theme-amber", label: "Amber" },
  { value: "theme-mono", label: "Mono" },
];

const legacyThemeMap: Record<string, string> = {
  "theme-default-scaled": "theme-default",
  "theme-blue-scaled": "theme-blue",
  "theme-green-scaled": "theme-green",
  "theme-amber-scaled": "theme-amber",
  "theme-mono-scaled": "theme-mono",
};

const allThemeClasses = [
  ...themeOptions.map((option) => option.value),
  ...Object.keys(legacyThemeMap),
];

function normalizeThemePreset(themePreset: string) {
  const normalizedTheme = legacyThemeMap[themePreset] ?? themePreset;

  return themeOptions.some((option) => option.value === normalizedTheme)
    ? normalizedTheme
    : DEFAULT_THEME;
}

function applyThemePreset(themePreset: string) {
  const normalizedTheme = normalizeThemePreset(themePreset);

  document.body.classList.remove(...allThemeClasses);
  document.body.classList.add(normalizedTheme);

  return normalizedTheme;
}

export function ThemeSelector() {
  const [selectedTheme, setSelectedTheme] = useState(DEFAULT_THEME);

  useEffect(() => {
    const storedTheme = normalizeThemePreset(
      window.localStorage.getItem(STORAGE_KEY) ?? DEFAULT_THEME,
    );

    setSelectedTheme(storedTheme);
    applyThemePreset(storedTheme);
    window.localStorage.setItem(STORAGE_KEY, storedTheme);
  }, []);

  function handleThemeChange(nextTheme: string) {
    const normalizedTheme = applyThemePreset(nextTheme);

    setSelectedTheme(normalizedTheme);
    window.localStorage.setItem(STORAGE_KEY, normalizedTheme);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="hidden sm:flex">
          <Palette />
          Theme
          <ChevronDown />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36">
        <DropdownMenuRadioGroup
          value={selectedTheme}
          onValueChange={handleThemeChange}
        >
          {themeOptions.map((option) => (
            <DropdownMenuRadioItem key={option.value} value={option.value}>
              {option.label}
              {selectedTheme === option.value ? (
                <Check className="ml-auto" />
              ) : null}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
