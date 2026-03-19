import { cookies } from "next/headers";
import type { CSSProperties } from "react";

import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { SiteHeader } from "@/components/dashboard/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { requireAdminPageAccess } from "@/lib/auth/admin-server";
import { getDashboardAccount } from "@/lib/dashboard-account";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [access, cookieStore] = await Promise.all([
    requireAdminPageAccess({ includeUser: true }),
    cookies(),
  ]);
  const account = getDashboardAccount(access.user);
  const defaultOpen = cookieStore.get("sidebar_state")?.value === "true";

  return (
    <TooltipProvider>
      <SidebarProvider
        defaultOpen={defaultOpen}
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
          } as CSSProperties
        }
      >
        <AppSidebar account={account} variant="inset" />
        <SidebarInset>
          <SiteHeader />
          {children}
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
