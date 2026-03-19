import { UserProfile } from "@clerk/nextjs";
import { LockKeyhole, Settings2 } from "lucide-react";

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

export default function SettingsPage() {
  return (
    <DashboardPage width="wide">
      <DashboardSection>
        <Card className="shadow-xs">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Settings2 className="size-4" />
              Account settings
            </CardTitle>
            <CardDescription>
              Manage your profile, session security, and account preferences
              without leaving the admin workspace.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 pt-4 xl:grid-cols-[280px_minmax(0,1fr)] xl:pt-6">
            <div className="rounded-xl border bg-muted/20 p-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <LockKeyhole className="size-4" />
                Protected account controls
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                This embedded Clerk view keeps profile edits, password updates,
                and device/session management inside the existing dashboard
                layout.
              </p>
            </div>

            <div className="overflow-hidden rounded-xl border bg-background">
              <UserProfile routing="hash" />
            </div>
          </CardContent>
        </Card>
      </DashboardSection>
    </DashboardPage>
  );
}
