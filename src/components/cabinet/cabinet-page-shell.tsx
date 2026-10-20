import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";

import { Page, PageHeader, type PageWidth } from "@/components/shell/page";
import {
  type CabinetRouteHref,
  getCabinetRouteByHref,
} from "@/lib/cabinet-routes";

/** Cabinet page: Page plus a PageHeader whose title comes from the route. */
export async function CabinetPage({
  actions,
  children,
  description,
  route,
  title,
  width = "default",
}: {
  actions?: ReactNode;
  children: ReactNode;
  description?: ReactNode;
  route?: CabinetRouteHref;
  title?: ReactNode;
  width?: PageWidth;
}) {
  const page = route ? getCabinetRouteByHref(route) : null;
  const t = await getTranslations("navigation.cabinet.routes");

  return (
    <Page width={width}>
      {page || title ? (
        <PageHeader
          title={title ?? (page ? t(`${page.key}.title`) : null)}
          description={
            description ?? (page ? t(`${page.key}.description`) : null)
          }
          actions={actions}
        />
      ) : null}
      {children}
    </Page>
  );
}
