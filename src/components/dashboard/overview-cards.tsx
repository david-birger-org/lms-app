import { CheckCircle2, TriangleAlert } from "lucide-react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function OverviewCards({
  readyCount,
  totalChecks,
}: {
  readyCount: number;
  totalChecks: number;
}) {
  const allReady = readyCount === totalChecks;
  const t = useTranslations("admin.overviewCards");

  return (
    <div id="overview" className="px-4 lg:px-6">
      <Card className="@container/card shadow-xs bg-gradient-to-t from-primary/5 to-card py-3 sm:max-w-sm sm:py-4 dark:bg-card">
        <CardHeader className="gap-1 px-3 sm:px-4">
          <CardDescription>{t("title")}</CardDescription>
          <CardTitle className="text-xl font-semibold tabular-nums sm:text-2xl @[250px]/card:text-3xl">
            {readyCount}/{totalChecks}
          </CardTitle>
          <CardAction>
            <Badge
              variant={allReady ? "outline" : "secondary"}
              className="h-4 px-1.5 text-[0.55rem] sm:h-5 sm:px-2 sm:text-[0.625rem]"
            >
              {allReady ? <CheckCircle2 /> : <TriangleAlert />}
              {allReady ? t("healthy") : t("attention")}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 px-3 text-xs sm:px-4 sm:text-sm">
          <div className="line-clamp-2 flex items-start gap-2 leading-tight font-medium sm:line-clamp-1 sm:items-center">
            {t("requiredKeysChecked")} <CheckCircle2 className="size-4" />
          </div>
          <div className="text-muted-foreground hidden sm:block">
            {t("description")}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
