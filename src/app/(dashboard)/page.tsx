import { BarChart3, PanelsTopLeft } from "lucide-react";

import { MonobankStatementProvider } from "@/components/admin/MonobankStatementProvider";
import { OverviewCards } from "@/components/dashboard/overview-cards";
import { PaymentsChart } from "@/components/dashboard/payments-chart";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getRuntimeChecks } from "@/lib/runtime-checks";

export default function OverviewPage() {
  const runtimeChecks = getRuntimeChecks();
  const readyCount = runtimeChecks.filter((item) => item.ready).length;

  return (
    <div className="@container/main mx-auto flex w-full max-w-[1200px] flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <OverviewCards
        readyCount={readyCount}
        totalChecks={runtimeChecks.length}
      />

      <MonobankStatementProvider>
        <section className="px-4 lg:px-6">
          <PaymentsChart />
        </section>
      </MonobankStatementProvider>

      <section className="px-4 lg:px-6">
        <Card className="shadow-xs">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="size-4" />
              Future Website Analytics
            </CardTitle>
            <CardDescription>
              This page is now reserved for overview-level reporting so Vercel
              website stats can land here cleanly later.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 pt-4 lg:grid-cols-2">
            <div className="rounded-lg border bg-muted/20 p-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <PanelsTopLeft className="size-4" />
                Overview-only shell
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Invoice creation, payment history, and runtime diagnostics now
                live on their own routes instead of competing for space here.
              </p>
            </div>
            <div className="rounded-lg border border-dashed bg-muted/10 p-4">
              <p className="text-sm font-medium">Next up</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Plug in Vercel analytics or external site metrics without mixing
                them with operational tools.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
