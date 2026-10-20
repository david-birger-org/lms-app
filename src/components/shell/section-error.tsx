"use client";

import { TriangleAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";

import { PageState } from "@/components/auth/public-page";
import { Button } from "@/components/ui/button";

// Error boundary body for the cabinet and admin: keeps the shell around the
// failed page instead of replacing the whole screen.
export function SectionError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  const t = useTranslations("errorPages.error");

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <PageState
        actions={
          <Button onClick={retry} size="lg" type="button">
            {t("retry")}
          </Button>
        }
        code={error.digest ? t("errorId", { id: error.digest }) : undefined}
        description={t("description")}
        icon={TriangleAlert}
        title={t("title")}
      />
    </div>
  );
}
