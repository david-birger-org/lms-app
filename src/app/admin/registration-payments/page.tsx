import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { RegistrationPaymentsTable } from "@/components/admin/RegistrationPaymentsTable";
import {
  DashboardPage,
  DashboardSection,
} from "@/components/dashboard/page-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { listAdminRegistrationPayments } from "@/lib/server/admin-registration-payments";

async function RegistrationPaymentsContent() {
  const payments = await listAdminRegistrationPayments();

  return (
    <DashboardSection>
      <RegistrationPaymentsTable payments={payments} />
    </DashboardSection>
  );
}

async function RegistrationPaymentsHeading() {
  const t = await getTranslations("navigation.dashboard.routes");

  return (
    <DashboardSection>
      <div className="flex flex-col gap-1 border-b pb-3">
        <h1 className="text-base font-semibold tracking-tight sm:text-lg">
          {t("registrationPayments.title")}
        </h1>
        <p className="max-w-3xl text-xs text-muted-foreground sm:text-sm">
          {t("registrationPayments.description")}
        </p>
      </div>
    </DashboardSection>
  );
}

export default async function AdminRegistrationPaymentsPage() {
  return (
    <DashboardPage width="wide">
      <RegistrationPaymentsHeading />
      <Suspense
        fallback={
          <DashboardSection>
            <Skeleton className="h-[400px] w-full rounded-xl" />
          </DashboardSection>
        }
      >
        <RegistrationPaymentsContent />
      </Suspense>
    </DashboardPage>
  );
}
