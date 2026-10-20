import { Suspense } from "react";

import { CabinetHeader } from "@/components/cabinet/cabinet-header";
import { CabinetBottomNav } from "@/components/cabinet/cabinet-navigation";
import { TooltipProvider } from "@/components/ui/tooltip";
import { requireAuthPageAccess } from "@/lib/auth/auth-server";
import { getDashboardAccount } from "@/lib/dashboard-account";
import { getActiveFeatures } from "@/lib/server/user-features";

export default async function UserDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const access = await requireAuthPageAccess();
  const account = getDashboardAccount(access.user);
  // Not awaited: the shell streams first and feature tabs fill in.
  const features = getActiveFeatures().then(
    (active) => [...active],
    () => [],
  );

  return (
    <TooltipProvider>
      <div className="flex min-h-svh flex-col">
        <CabinetHeader
          account={account}
          features={features}
          showAdminLink={access.role === "admin"}
        />
        <main className="flex flex-1 flex-col pb-[calc(var(--bottom-nav-height)+env(safe-area-inset-bottom))] md:pb-0">
          {children}
        </main>
        <Suspense fallback={<CabinetBottomNav />}>
          <CabinetBottomNav features={features} />
        </Suspense>
      </div>
    </TooltipProvider>
  );
}
