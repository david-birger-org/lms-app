import { Activity, ArrowRight, ShieldCheck, Waypoints } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface RuntimeCheck {
  label: string;
  ready: boolean;
}

const routeRows = [
  {
    title: "Invoice creation",
    value: "POST /api/monobank/invoice",
  },
  {
    title: "Invoice status",
    value: "GET /api/monobank/invoice/status",
  },
  {
    title: "Statement sync",
    value: "GET /api/monobank/statement",
  },
];

export function OperationsStatusCard({ checks }: { checks: RuntimeCheck[] }) {
  const readyCount = checks.filter((check) => check.ready).length;

  return (
    <Card id="runtime-checks" className="scroll-mt-24 shadow-xs">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="size-4" />
          Runtime Checks
        </CardTitle>
        <CardDescription>
          Environment health, auth posture, and API surfaces that support the
          admin dashboard.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 pt-4">
        <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2">
          <div>
            <p className="text-sm font-medium">Readiness score</p>
            <p className="text-xs text-muted-foreground">
              {readyCount} of {checks.length} required keys detected
            </p>
          </div>
          <Badge
            variant={readyCount === checks.length ? "outline" : "secondary"}
          >
            <Activity />
            {readyCount === checks.length ? "Healthy" : "Review"}
          </Badge>
        </div>
        <div className="space-y-2">
          {checks.map((check) => (
            <div
              key={check.label}
              className="flex items-center justify-between rounded-lg border bg-background px-3 py-2"
            >
              <span className="text-sm text-foreground/80">{check.label}</span>
              <Badge variant={check.ready ? "outline" : "secondary"}>
                <span
                  className={check.ready ? "bg-emerald-500" : "bg-amber-500"}
                  aria-hidden="true"
                  style={{
                    width: "0.45rem",
                    height: "0.45rem",
                    borderRadius: "9999px",
                  }}
                />
                {check.ready ? "Ready" : "Missing"}
              </Badge>
            </div>
          ))}
        </div>
        <Separator />
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Waypoints className="size-4 text-muted-foreground" />
            <p className="text-sm font-medium">Protected surfaces</p>
          </div>
          <div className="space-y-2">
            {routeRows.map((route) => (
              <div
                key={route.value}
                className="rounded-lg border bg-muted/20 px-3 py-2"
              >
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  {route.title}
                </p>
                <p className="mt-1 font-mono text-xs text-foreground">
                  {route.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
      <CardFooter className="border-t pt-4 text-sm text-muted-foreground">
        Auth is enforced by Better Auth session checks before any invoice or
        statement request reaches the proxy.
        <ArrowRight className="ml-2 size-4" />
      </CardFooter>
    </Card>
  );
}
