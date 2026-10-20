import { ShieldAlert } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { PageState, PublicPage } from "@/components/auth/public-page";
import { SwitchAccountButton } from "@/components/auth/switch-account-button";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";

export default async function UnauthorizedPage() {
  const t = await getTranslations("unauthorized");

  return (
    <PublicPage>
      <PageState
        actions={
          <>
            <Button asChild size="lg">
              <Link href="/dashboard">{t("dashboard")}</Link>
            </Button>
            <SwitchAccountButton />
          </>
        }
        code="403"
        description={t("description")}
        icon={ShieldAlert}
        title={t("title")}
      />
    </PublicPage>
  );
}
