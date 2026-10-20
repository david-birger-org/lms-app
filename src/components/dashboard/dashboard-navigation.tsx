"use client";

import { useTranslations } from "next-intl";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Link, usePathname } from "@/i18n/routing";
import { dashboardRouteGroups, dashboardRoutes } from "@/lib/dashboard-routes";

export function DashboardNavigation() {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();
  const t = useTranslations("navigation.dashboard");

  return dashboardRouteGroups.map((group) => (
    <SidebarGroup key={group} className="py-1.5">
      {group === "general" ? null : (
        <SidebarGroupLabel>{t(`groups.${group}`)}</SidebarGroupLabel>
      )}
      <SidebarGroupContent>
        <SidebarMenu className="gap-0.5">
          {dashboardRoutes
            .filter((item) => item.group === group)
            .map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton asChild isActive={pathname === item.href}>
                  <Link
                    href={item.href}
                    aria-current={pathname === item.href ? "page" : undefined}
                    onClick={() => {
                      if (isMobile) setOpenMobile(false);
                    }}
                  >
                    <item.icon />
                    <span>{t(`routes.${item.key}.title`)}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  ));
}

export function DashboardBreadcrumb() {
  const pathname = usePathname();
  const t = useTranslations("navigation.dashboard");
  const route = dashboardRoutes.find((item) => item.href === pathname);

  return (
    <div className="flex min-w-0 items-center gap-1.5 text-sm">
      <span className="hidden text-muted-foreground sm:inline">
        {t("header.section")}
      </span>
      {route ? (
        <>
          <span aria-hidden className="hidden text-gray-500 sm:inline">
            /
          </span>
          <span className="truncate font-medium">
            {t(`routes.${route.key}.title`)}
          </span>
        </>
      ) : null}
    </div>
  );
}
