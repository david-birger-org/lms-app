import type { LucideIcon } from "lucide-react";
import {
  Clock,
  CreditCard,
  History,
  LayoutDashboard,
  Package,
  ScrollText,
  Settings,
  Users,
} from "lucide-react";

export interface DashboardRoute {
  href: string;
  key:
    | "overview"
    | "invoice"
    | "pending"
    | "paymentHistory"
    | "statementAudit"
    | "products"
    | "users"
    | "settings";
  icon: LucideIcon;
}

export const dashboardRoutes = [
  {
    href: "/admin",
    key: "overview",
    icon: LayoutDashboard,
  },
  {
    href: "/admin/invoice",
    key: "invoice",
    icon: CreditCard,
  },
  {
    href: "/admin/pending",
    key: "pending",
    icon: Clock,
  },
  {
    href: "/admin/payment-history",
    key: "paymentHistory",
    icon: History,
  },
  {
    href: "/admin/statement-audit",
    key: "statementAudit",
    icon: ScrollText,
  },
  {
    href: "/admin/products",
    key: "products",
    icon: Package,
  },
  {
    href: "/admin/users",
    key: "users",
    icon: Users,
  },
  {
    href: "/admin/settings",
    key: "settings",
    icon: Settings,
  },
] as const satisfies readonly DashboardRoute[];

export type DashboardRouteHref = (typeof dashboardRoutes)[number]["href"];

export function getDashboardRoute(pathname: string) {
  return (
    dashboardRoutes.find((route) => route.href === pathname) ??
    dashboardRoutes[0]
  );
}

export function getDashboardRouteByHref(href: DashboardRouteHref) {
  return getDashboardRoute(href);
}
