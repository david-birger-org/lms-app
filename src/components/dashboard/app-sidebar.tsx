import { useTranslations } from "next-intl";

import { DashboardNavigation } from "@/components/dashboard/dashboard-navigation";
import { Logo } from "@/components/shell/logo";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { Link } from "@/i18n/routing";

export function AppSidebar() {
  const t = useTranslations("navigation.dashboard");

  return (
    <Sidebar collapsible="offcanvas">
      <SidebarHeader className="h-14 justify-center border-b px-3">
        <Link
          href="/admin"
          className="flex min-w-0 items-center gap-2.5 rounded-md px-1 py-1 outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <Logo />
          <span className="flex min-w-0 flex-col leading-tight">
            <span className="truncate text-sm font-semibold">
              {t("workspaceTitle")}
            </span>
            <span className="truncate text-xs text-muted-foreground">
              {t("workspaceSubtitle")}
            </span>
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent className="py-2">
        <DashboardNavigation />
      </SidebarContent>
    </Sidebar>
  );
}
