import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";

import { DashboardPageHeading } from "@/components/dashboard/page-heading";
import {
  type DashboardRouteHref,
  getDashboardRouteByHref,
} from "@/lib/dashboard-routes";
import { cn } from "@/lib/utils";

const pageWidthClasses = {
  default: "max-w-[1200px]",
  wide: "max-w-[1400px]",
} as const;

export async function DashboardPage({
  children,
  route,
  width = "default",
}: {
  children: ReactNode;
  route?: DashboardRouteHref;
  width?: keyof typeof pageWidthClasses;
}) {
  const page = route ? getDashboardRouteByHref(route) : null;
  const t = page ? await getTranslations("navigation.dashboard.routes") : null;

  return (
    <div
      className={cn(
        "@container/main mx-auto flex w-full flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6",
        pageWidthClasses[width],
      )}
    >
      {page ? (
        <DashboardSection>
          <DashboardPageHeading
            title={t?.(`${page.key}.title`) ?? ""}
            description={t?.(`${page.key}.description`) ?? ""}
            icon={page.icon}
          />
        </DashboardSection>
      ) : null}
      {children}
    </div>
  );
}

export function DashboardSection({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("px-4 lg:px-6", className)}>{children}</section>
  );
}
