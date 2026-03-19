import type { LucideIcon } from "lucide-react";
import {
  ArrowRightLeft,
  CheckCircle2,
  CreditCard,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface DashboardCard {
  title: string;
  value: string;
  description: string;
  footer: string;
  badge: string;
  icon: LucideIcon;
}

const dashboardCards: DashboardCard[] = [
  {
    title: "Invoice Rail",
    value: "Monobank",
    description: "Link + QR issuance",
    footer: "Operators can generate payment links without leaving the shell.",
    badge: "Proxy",
    icon: CreditCard,
  },
  {
    title: "Auth Guard",
    value: "Clerk",
    description: "Session-based access",
    footer: "All routes remain protected behind Clerk middleware.",
    badge: "Secure",
    icon: ShieldCheck,
  },
  {
    title: "History Window",
    value: "90 days",
    description: "Statement sync",
    footer:
      "Recent payment activity stays searchable and refreshable from one table.",
    badge: "Live",
    icon: ArrowRightLeft,
  },
];

export function OverviewCards({
  readyCount,
  totalChecks,
}: {
  readyCount: number;
  totalChecks: number;
}) {
  return (
    <div
      id="overview"
      className="scroll-mt-24 grid auto-cols-[minmax(11rem,1fr)] grid-flow-col gap-3 overflow-x-auto px-4 pb-1 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs sm:auto-cols-auto sm:grid-flow-row sm:grid-cols-2 sm:overflow-visible sm:pb-0 lg:px-6 @5xl/main:grid-cols-4 dark:*:data-[slot=card]:bg-card"
    >
      <Card className="@container/card min-w-[11rem] snap-start py-3 sm:min-w-0 sm:py-4">
        <CardHeader className="gap-1 px-3 sm:px-4">
          <CardDescription>Runtime Readiness</CardDescription>
          <CardTitle className="text-xl font-semibold tabular-nums sm:text-2xl @[250px]/card:text-3xl">
            {readyCount}/{totalChecks}
          </CardTitle>
          <CardAction>
            <Badge
              variant={readyCount === totalChecks ? "outline" : "secondary"}
              className="h-4 px-1.5 text-[0.55rem] sm:h-5 sm:px-2 sm:text-[0.625rem]"
            >
              {readyCount === totalChecks ? (
                <CheckCircle2 />
              ) : (
                <TriangleAlert />
              )}
              {readyCount === totalChecks ? "Healthy" : "Attention"}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 px-3 text-xs sm:px-4 sm:text-sm">
          <div className="line-clamp-2 flex items-start gap-2 leading-tight font-medium sm:line-clamp-1 sm:items-center">
            Required keys checked <CheckCircle2 className="size-4" />
          </div>
          <div className="text-muted-foreground hidden sm:block">
            Clerk and lms-sls are available for the protected workspace.
          </div>
        </CardFooter>
      </Card>
      {dashboardCards.map((card) => (
        <Card
          key={card.title}
          className="@container/card min-w-[11rem] snap-start py-3 sm:min-w-0 sm:py-4"
        >
          <CardHeader className="gap-1 px-3 sm:px-4">
            <CardDescription>{card.title}</CardDescription>
            <CardTitle className="text-xl font-semibold tabular-nums sm:text-2xl @[250px]/card:text-3xl">
              {card.value}
            </CardTitle>
            <CardAction>
              <Badge
                variant="outline"
                className="h-4 px-1.5 text-[0.55rem] sm:h-5 sm:px-2 sm:text-[0.625rem]"
              >
                <card.icon />
                {card.badge}
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1 px-3 text-xs sm:px-4 sm:text-sm">
            <div className="line-clamp-2 flex items-start gap-2 leading-tight font-medium sm:line-clamp-1 sm:items-center">
              {card.description}
            </div>
            <div className="text-muted-foreground hidden sm:block">
              {card.footer}
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
