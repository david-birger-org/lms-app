import { cookies } from "next/headers";
import type { CSSProperties } from "react";

import { CabinetHeader } from "@/components/cabinet/cabinet-header";
import { CabinetSidebar } from "@/components/cabinet/cabinet-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { requireAuthPageAccess } from "@/lib/auth/auth-server";
import { getDashboardAccount } from "@/lib/dashboard-account";
import { getActiveFeatures } from "@/lib/server/user-features";

export default async function UserDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [access, cookieStore, activeFeatures] = await Promise.all([
    requireAuthPageAccess(),
    cookies(),
    getActiveFeatures(),
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
        <CabinetSidebar
          account={account}
          activeFeatures={[...activeFeatures]}
          showAdminLink={access.role === "admin"}
          variant="inset"
        />
        <SidebarInset>
          <CabinetHeader />
          {children}
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
