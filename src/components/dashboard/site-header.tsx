import { AccountMenu } from "@/components/auth/account-menu";
import { DashboardBreadcrumb } from "@/components/dashboard/dashboard-navigation";
import { LanguageSwitcherClient } from "@/components/layout/language-switcher-client";
import { Logo } from "@/components/shell/logo";
import { SidebarTrigger } from "@/components/ui/sidebar";
import type { DashboardAccount } from "@/lib/dashboard-account";

export function SiteHeader({
  account,
  userDashboardLabel,
}: {
  account: DashboardAccount;
  userDashboardLabel: string;
}) {
  return (
    <header className="sticky top-0 z-30 flex h-(--header-height) shrink-0 items-center gap-2 border-b bg-background/80 px-3 backdrop-blur-md md:px-4">
      <SidebarTrigger />
      <Logo className="md:hidden" />
      <DashboardBreadcrumb />
      <div className="ml-auto flex items-center gap-1.5">
        <LanguageSwitcherClient />
        <AccountMenu
          email={account.email}
          fullName={account.fullName}
          settingsHref="/admin/settings"
          secondaryHref="/dashboard"
          secondaryLabel={userDashboardLabel}
        />
      </div>
    </header>
  );
}
