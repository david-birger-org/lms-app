import { AccountSettingsPanel } from "@/components/auth/account-settings-panel";
import { CabinetPage } from "@/components/cabinet/cabinet-page-shell";
import { resolveUserRole } from "@/lib/auth/admin";
import { requireAuthPageAccess } from "@/lib/auth/auth-server";
import { getDashboardAccount } from "@/lib/dashboard-account";

export default async function DashboardSettingsPage() {
  const access = await requireAuthPageAccess();
  const account = getDashboardAccount(access.user);

  return (
    <CabinetPage route="/dashboard/settings" width="narrow">
      <AccountSettingsPanel
        email={access.user.email}
        fullName={account.fullName}
        role={resolveUserRole(access.user) ?? "user"}
      />
    </CabinetPage>
  );
}
