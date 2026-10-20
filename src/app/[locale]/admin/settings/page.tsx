import { AccountSettingsPanel } from "@/components/auth/account-settings-panel";
import { DashboardPage } from "@/components/dashboard/page-shell";
import { NotificationsSettingsCard } from "@/components/settings/notifications-settings-card";
import { resolveUserRole } from "@/lib/auth/admin";
import { requireAdminPageAccess } from "@/lib/auth/admin-server";

export default async function AdminSettingsPage() {
  const access = await requireAdminPageAccess();

  return (
    <DashboardPage route="/admin/settings" width="narrow">
      <AccountSettingsPanel
        email={access.user.email}
        fullName={access.user.name}
        role={resolveUserRole(access.user) ?? "user"}
      />
      <NotificationsSettingsCard />
    </DashboardPage>
  );
}
