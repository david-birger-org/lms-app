"use client";

import { ShieldCheck } from "lucide-react";
import { usePathname } from "next/navigation";

import { ModeToggle } from "@/components/dashboard/mode-toggle";
import { ThemeSelector } from "@/components/dashboard/theme-selector";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { getDashboardRoute } from "@/lib/dashboard-routes";

export function SiteHeader() {
  const pathname = usePathname();
  const page = getDashboardRoute(pathname);

  return (
    <header className="sticky top-0 z-20 flex h-(--header-height) shrink-0 items-center border-b bg-background/90 backdrop-blur-sm">
      <div className="flex w-full items-center gap-2 px-4 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-sm font-medium">{page.title}</h1>
            <Badge variant="outline" className="hidden md:inline-flex">
              <ShieldCheck />
              Protected
            </Badge>
          </div>
          <p className="hidden truncate text-xs text-muted-foreground md:block">
            {page.description}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <ThemeSelector />
          <ModeToggle />
        </div>
      </div>
    </header>
  );
}
