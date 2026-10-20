import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { CabinetPage } from "@/components/cabinet/cabinet-page-shell";
import { UserPurchases } from "@/components/cabinet/UserPurchases";
import { Section } from "@/components/shell/page";
import { Skeleton } from "@/components/ui/skeleton";
import { listUserPurchases } from "@/lib/server/user-purchases";

async function PurchasesContent() {
  const [purchases, t] = await Promise.all([
    listUserPurchases(),
    getTranslations("purchases"),
  ]);

  return (
    <Section title={t("title")} description={t("description")}>
      <UserPurchases initialPurchases={purchases} />
    </Section>
  );
}

const SKELETON_ROWS = ["a", "b", "c", "d", "e"];

function PurchasesSkeleton() {
  return (
    <Section>
      <div className="flex flex-col gap-1.5">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-4 w-64 max-w-full" />
      </div>
      <div className="divide-y overflow-hidden rounded-xl border bg-card shadow-card">
        {SKELETON_ROWS.map((key) => (
          <div
            key={key}
            className="flex items-center justify-between gap-4 p-4 md:h-12 md:px-3 md:py-0"
          >
            <Skeleton className="h-4 w-40 md:w-56" />
            <div className="flex items-center gap-6">
              <Skeleton className="hidden h-4 w-20 md:block" />
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="hidden h-4 w-24 md:block" />
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

export default function DashboardPurchasesPage() {
  return (
    <CabinetPage route="/dashboard/purchases">
      <Suspense fallback={<PurchasesSkeleton />}>
        <PurchasesContent />
      </Suspense>
    </CabinetPage>
  );
}
