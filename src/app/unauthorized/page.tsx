import { ShieldAlert } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { SwitchAccountButton } from "@/components/auth/switch-account-button";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Link } from "@/i18n/routing";

export default async function UnauthorizedPage() {
  const t = await getTranslations("unauthorized");

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-3xl items-center px-4 py-8 sm:px-6">
      <Card className="w-full shadow-xs">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="size-4" />
            {t("title")}
          </CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <p className="text-sm text-muted-foreground">{t("body")}</p>
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href="/dashboard">{t("dashboard")}</Link>
            </Button>
            <SwitchAccountButton />
            <Button variant="outline" asChild>
              <Link href="/sign-in">{t("signIn")}</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
