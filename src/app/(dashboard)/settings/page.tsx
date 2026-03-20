import { Settings2 } from "lucide-react";

import { AccountSettingsPanel } from "@/components/auth/account-settings-panel";
import {
  DashboardPage,
  DashboardSection,
} from "@/components/dashboard/page-shell";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { resolveUserRole } from "@/lib/auth/admin";
import { requireAdminPageAccess } from "@/lib/auth/admin-server";

export default async function SettingsPage() {
  const access = await requireAdminPageAccess();

  return (
    <DashboardPage route="/settings" width="wide">
      <DashboardSection>
        <Card className="shadow-xs">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Settings2 className="size-4" />
              Account settings
            </CardTitle>
            <CardDescription>
              Update your Better Auth profile and session security without
              leaving the admin workspace.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 xl:pt-6">
            <AccountSettingsPanel
              email={access.user.email}
              fullName={access.user.name}
              role={resolveUserRole(access.user) ?? "user"}
            />
          </CardContent>
        </Card>
      </DashboardSection>
    </DashboardPage>
  );
}
