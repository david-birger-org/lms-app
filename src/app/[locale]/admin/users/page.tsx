import { Suspense } from "react";

import { AdminListSkeleton } from "@/components/admin/admin-list-skeleton";
import { UsersManager } from "@/components/admin/UsersManager";
import { DashboardPage } from "@/components/dashboard/page-shell";
import { Section } from "@/components/shell/page";
import { listAdminUsers } from "@/lib/server/admin-users";

async function UsersContent() {
  const users = await listAdminUsers();

  return (
    <Section>
      <UsersManager initialUsers={users} />
    </Section>
  );
}

export default function AdminUsersPage() {
  return (
    <DashboardPage route="/admin/users">
      <Suspense fallback={<AdminListSkeleton />}>
        <UsersContent />
      </Suspense>
    </DashboardPage>
  );
}
