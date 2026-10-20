import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { PaymentsHistoryProvider } from "@/components/admin/PaymentsDataProvider";
import { DashboardPage } from "@/components/dashboard/page-shell";
import { PaymentsChart } from "@/components/dashboard/payments-chart";
import { Section } from "@/components/shell/page";
import { StatCard } from "@/components/shell/stat-card";
import { StatusBadge } from "@/components/shell/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getRuntimeChecks } from "@/lib/runtime-checks";
import { getInitialPaymentsHistoryState } from "@/lib/server/payments";

async function PaymentsChartSection() {
  const paymentHistory = await getInitialPaymentsHistoryState();

  return (
    <PaymentsHistoryProvider {...paymentHistory}>
      <PaymentsChart />
    </PaymentsHistoryProvider>
  );
}

export default async function AdminOverviewPage() {
  const t = await getTranslations("admin.overviewCards");
  const runtimeChecks = getRuntimeChecks();
  const readyCount = runtimeChecks.filter((item) => item.ready).length;
  const allReady = readyCount === runtimeChecks.length;

  return (
    <DashboardPage route="/admin">
      <Section>
        <div className="grid gap-3 sm:grid-cols-2 md:gap-4 lg:grid-cols-3">
          <StatCard
            label={t("title")}
            value={`${readyCount}/${runtimeChecks.length}`}
            hint={allReady ? t("description") : t("requiredKeysChecked")}
            badge={
              <StatusBadge status={allReady ? "success" : "warning"}>
                {allReady ? t("healthy") : t("attention")}
              </StatusBadge>
            }
          />
        </div>
      </Section>

      <Section>
        <Suspense fallback={<Skeleton className="h-[460px] rounded-xl" />}>
          <PaymentsChartSection />
        </Suspense>
      </Section>
    </DashboardPage>
  );
}
