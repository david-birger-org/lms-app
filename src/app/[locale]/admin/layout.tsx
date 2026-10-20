import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";

import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { SiteHeader } from "@/components/dashboard/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { requireAdminPageAccess } from "@/lib/auth/admin-server";
import { getDashboardAccount } from "@/lib/dashboard-account";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [access, cookieStore, t] = await Promise.all([
    requireAdminPageAccess(),
    cookies(),
    getTranslations("navigation.dashboard"),
  ]);
  const account = getDashboardAccount(access.user);
  // Open on desktop unless the user collapsed it.
  const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false";

  return (
    <TooltipProvider>
      <SidebarProvider defaultOpen={defaultOpen}>
        <AppSidebar />
        <SidebarInset>
          <SiteHeader
            account={account}
            userDashboardLabel={t("userDashboard")}
          />
          {children}
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
