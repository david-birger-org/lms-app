import { User } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ComponentProps } from "react";

import { AccountMenu } from "@/components/auth/account-menu";
import { CabinetNavigation } from "@/components/cabinet/cabinet-navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import type { DashboardAccount } from "@/lib/dashboard-account";

export function CabinetSidebar({
  account,
  activeFeatures,
  showAdminLink = false,
  ...props
}: ComponentProps<typeof Sidebar> & {
  account: DashboardAccount;
  activeFeatures: string[];
  showAdminLink?: boolean;
}) {
  const t = useTranslations("navigation.cabinet");
  const dashboardT = useTranslations("navigation.dashboard");

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader className="border-b border-sidebar-border/60">
        <div className="flex items-center gap-3 rounded-lg border border-sidebar-border/70 bg-sidebar-accent/40 p-2">
          <div className="flex size-9 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <User className="size-4" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-sidebar-foreground">
              {t("title")}
            </p>
            <p className="truncate text-xs text-sidebar-foreground/70">
              {account.fullName}
            </p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <CabinetNavigation label={t("label")} activeFeatures={activeFeatures} />
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border/60">
        <AccountMenu
          email={account.email}
          fullName={account.fullName}
          settingsHref="/dashboard/settings"
          secondaryHref={showAdminLink ? "/admin" : undefined}
          secondaryLabel={
            showAdminLink ? dashboardT("adminWorkspace") : undefined
          }
        />
      </SidebarFooter>
    </Sidebar>
  );
}
