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
import { cabinetRoutes } from "@/lib/cabinet-routes";

export function CabinetNavigation({
  label,
  activeFeatures,
}: {
  label: string;
  activeFeatures: string[];
}) {
  const t = useTranslations("navigation.cabinet");
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();

  const featureSet = new Set(activeFeatures);
  const visibleRoutes = cabinetRoutes.filter((route) => {
    const feature = "requiredFeature" in route ? route.requiredFeature : undefined;
    return !feature || featureSet.has(feature);
  });

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {visibleRoutes.map((item) => {
            const isActive = pathname === item.href;

            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton asChild isActive={isActive}>
                  <Link
                    href={item.href}
                    onClick={() => {
                      if (isMobile) setOpenMobile(false);
                    }}
                  >
                    <item.icon />
                    <span>{t(`routes.${item.key}.title`)}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
