import { type LucideIcon, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";

export function DashboardPageHeading({
  title,
  description,
  icon: PageIcon,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
}) {
  const t = useTranslations("navigation");

  return (
    <div className="flex flex-col gap-4 rounded-2xl border bg-background/80 px-4 py-4 shadow-xs sm:flex-row sm:items-start sm:justify-between lg:px-6">
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border bg-muted/30">
          <PageIcon className="size-4" />
        </div>
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate text-lg font-semibold tracking-tight sm:text-xl">
              {title}
            </h1>
            <Badge variant="outline" className="hidden md:inline-flex">
              <ShieldCheck />
              {t("protected")}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
    </div>
  );
}
