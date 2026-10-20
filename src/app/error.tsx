"use client";

import { TriangleAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";

import { PageState, PublicPage } from "@/components/auth/public-page";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";

export default function ErrorPage({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  const t = useTranslations("errorPages.error");

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <PublicPage>
      <PageState
        actions={
          <>
            <Button onClick={() => unstable_retry()} size="lg" type="button">
              {t("retry")}
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/">{t("home")}</Link>
            </Button>
          </>
        }
        code={error.digest ? t("errorId", { id: error.digest }) : undefined}
        description={t("description")}
        icon={TriangleAlert}
        title={t("title")}
      />
    </PublicPage>
  );
}
