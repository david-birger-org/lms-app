"use client";

import { ModeToggle } from "@/components/dashboard/mode-toggle";
import { ThemeSelector } from "@/components/dashboard/theme-selector";

export function DashboardHeaderControls() {
  return (
    <div className="ml-auto flex items-center gap-2">
      <ThemeSelector />
      <ModeToggle />
    </div>
  );
}
