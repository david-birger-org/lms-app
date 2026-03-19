import { ShieldCheck } from "lucide-react";

import { DashboardHeaderControls } from "@/components/dashboard/dashboard-header-controls";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function SiteHeader() {
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
            <h1 className="truncate text-sm font-medium">LMS Admin</h1>
            <Badge variant="outline" className="hidden md:inline-flex">
              <ShieldCheck />
              Protected
            </Badge>
          </div>
          <p className="hidden truncate text-xs text-muted-foreground md:block">
            Monobank operations workspace
          </p>
        </div>
        <DashboardHeaderControls />
      </div>
    </header>
  );
}
