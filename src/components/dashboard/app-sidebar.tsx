import { ShieldCheck } from "lucide-react";
import type { ComponentProps } from "react";

import { AccountMenu } from "@/components/auth/account-menu";
import { DashboardNavigation } from "@/components/dashboard/dashboard-navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import type { DashboardAccount } from "@/lib/dashboard-account";

function SidebarAccount({ account }: { account: DashboardAccount }) {
  return <AccountMenu email={account.email} fullName={account.fullName} />;
}

export function AppSidebar({
  account,
  ...props
}: ComponentProps<typeof Sidebar> & {
  account: DashboardAccount;
}) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader className="border-b border-sidebar-border/60">
        <div className="flex items-center gap-3 rounded-lg border border-sidebar-border/70 bg-sidebar-accent/40 p-2">
          <div className="flex size-9 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <ShieldCheck className="size-4" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-sidebar-foreground">
              LMS Admin
            </p>
            <p className="truncate text-xs text-sidebar-foreground/70">
              Monobank workspace
            </p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <DashboardNavigation label="Operations" />
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border/60">
        <SidebarAccount account={account} />
      </SidebarFooter>
    </Sidebar>
  );
}
