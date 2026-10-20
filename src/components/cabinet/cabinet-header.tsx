import { useTranslations } from "next-intl";
import { Suspense } from "react";

import { AccountMenu } from "@/components/auth/account-menu";
import { CabinetTabs } from "@/components/cabinet/cabinet-navigation";
import { LanguageSwitcherClient } from "@/components/layout/language-switcher-client";
import { ContextSlash, Logo } from "@/components/shell/logo";
import { Link } from "@/i18n/routing";
import type { DashboardAccount } from "@/lib/dashboard-account";

export function CabinetHeader({
  account,
  features,
  showAdminLink,
}: {
  account: DashboardAccount;
  features: Promise<string[]>;
  showAdminLink: boolean;
}) {
  const t = useTranslations("navigation");

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-(--header-height) max-w-6xl items-center gap-2 px-4 md:px-6">
        <Link
          href="/dashboard"
          className="flex shrink-0 items-center gap-2.5 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <Logo />
          <span className="hidden text-sm font-semibold sm:inline">
            {t("dashboard.workspaceTitle")}
          </span>
        </Link>
        <ContextSlash />
        <span className="min-w-0 truncate text-sm font-medium">
          {account.fullName}
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          <LanguageSwitcherClient />
          <AccountMenu
            email={account.email}
            fullName={account.fullName}
            settingsHref="/dashboard/settings"
            secondaryHref={showAdminLink ? "/admin" : undefined}
            secondaryLabel={
              showAdminLink ? t("dashboard.adminWorkspace") : undefined
            }
          />
        </div>
      </div>
      <Suspense fallback={<CabinetTabs />}>
        <CabinetTabs features={features} />
      </Suspense>
    </header>
  );
}
