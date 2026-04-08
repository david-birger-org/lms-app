import { redirect } from "@/i18n/routing";

import { requireAuthPageAccess } from "@/lib/auth/auth-server";

export default async function LocalizedRootPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const access = await requireAuthPageAccess();
  const { locale } = await params;

  if (access.role === "admin") redirect({ href: "/admin", locale });

  redirect({ href: "/dashboard", locale });
}
