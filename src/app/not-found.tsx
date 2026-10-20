import { FileQuestion } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { PageState, PublicPage } from "@/components/auth/public-page";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";

export default async function NotFound() {
  const t = await getTranslations("errorPages.notFound");

  return (
    <PublicPage>
      <PageState
        actions={
          <Button asChild size="lg">
            <Link href="/">{t("action")}</Link>
          </Button>
        }
        code="404"
        description={t("description")}
        icon={FileQuestion}
        title={t("title")}
      />
    </PublicPage>
  );
}
