import type { LucideIcon } from "lucide-react";
import { BookOpen, LayoutDashboard, Settings, ShoppingBag } from "lucide-react";

export interface CabinetRoute {
  href: string;
  key: "overview" | "purchases" | "lectures" | "settings";
  icon: LucideIcon;
  requiredFeature?: string;
}

export const cabinetRoutes = [
  {
    href: "/dashboard",
    key: "overview",
    icon: LayoutDashboard,
  },
  {
    href: "/dashboard/purchases",
    key: "purchases",
    icon: ShoppingBag,
  },
  {
    href: "/dashboard/lectures",
    key: "lectures",
    icon: BookOpen,
    requiredFeature: "lectures",
  },
  {
    href: "/dashboard/settings",
    key: "settings",
    icon: Settings,
  },
] as const satisfies readonly CabinetRoute[];

export type CabinetRouteHref = (typeof cabinetRoutes)[number]["href"];

export function getCabinetRoute(pathname: string) {
  return (
    cabinetRoutes.find((route) => route.href === pathname) ?? cabinetRoutes[0]
  );
}

export function getCabinetRouteByHref(href: CabinetRouteHref) {
  return getCabinetRoute(href);
}
