import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  Clock,
  CreditCard,
  History,
  Inbox,
  LayoutDashboard,
  Package,
  ReceiptText,
  ScrollText,
  Settings,
  Users,
  Video,
} from "lucide-react";

export const dashboardRouteGroups = [
  "general",
  "payments",
  "content",
  "people",
  "account",
] as const;

export type DashboardRouteGroup = (typeof dashboardRouteGroups)[number];

export interface DashboardRoute {
  href: string;
  group: DashboardRouteGroup;
  key:
    | "overview"
    | "invoice"
    | "pending"
    | "paymentHistory"
    | "registrationPayments"
    | "statementAudit"
    | "products"
    | "lectures"
    | "videos"
    | "users"
    | "requests"
    | "settings";
  icon: LucideIcon;
}

export const dashboardRoutes = [
  {
    href: "/admin",
    key: "overview",
    group: "general",
    icon: LayoutDashboard,
  },
  {
    href: "/admin/invoice",
    key: "invoice",
    group: "payments",
    icon: CreditCard,
  },
  {
    href: "/admin/pending",
    key: "pending",
    group: "payments",
    icon: Clock,
  },
  {
    href: "/admin/payment-history",
    key: "paymentHistory",
    group: "payments",
    icon: History,
  },
  {
    href: "/admin/registration-payments",
    key: "registrationPayments",
    group: "payments",
    icon: ReceiptText,
  },
  {
    href: "/admin/statement-audit",
    key: "statementAudit",
    group: "payments",
    icon: ScrollText,
  },
  {
    href: "/admin/products",
    key: "products",
    group: "content",
    icon: Package,
  },
  {
    href: "/admin/lectures",
    key: "lectures",
    group: "content",
    icon: BookOpen,
  },
  {
    href: "/admin/videos",
    key: "videos",
    group: "content",
    icon: Video,
  },
  {
    href: "/admin/users",
    key: "users",
    group: "people",
    icon: Users,
  },
  {
    href: "/admin/requests",
    key: "requests",
    group: "people",
    icon: Inbox,
  },
  {
    href: "/admin/settings",
    key: "settings",
    group: "account",
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
