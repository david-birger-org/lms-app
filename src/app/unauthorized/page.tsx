import { ShieldAlert } from "lucide-react";
import Link from "next/link";

import { SwitchAccountButton } from "@/components/auth/switch-account-button";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function UnauthorizedPage() {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-3xl items-center px-4 py-8 sm:px-6">
      <Card className="w-full shadow-xs">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="size-4" />
            Access restricted
          </CardTitle>
          <CardDescription>
            This workspace is limited to users with the Clerk role `admin`.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <p className="text-sm text-muted-foreground">
            Your account is signed in, but it does not currently have permission
            to use this application. Contact an administrator if you believe
            this is incorrect.
          </p>
          <div className="flex flex-wrap gap-2">
            <SwitchAccountButton />
            <Button variant="outline" asChild>
              <Link href="/sign-in">Go to sign-in</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
