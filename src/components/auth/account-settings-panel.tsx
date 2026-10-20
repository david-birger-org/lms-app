"use client";

import { LogOut } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "@/i18n/routing";
import { authClient } from "@/lib/auth-client";

// Fields stay one column and cap their width from md, like Vercel settings.
const FIELD = "flex flex-col gap-2 md:max-w-sm";
const INPUT = "max-md:h-10";
const ACTION = "max-md:h-10 shrink-0";
const FOOTER =
  "flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4";

/**
 * Profile, password and session cards. Renders a fragment so each card is a
 * direct child of the page and enters in the page stagger.
 */
export function AccountSettingsPanel({
  email,
  fullName,
  role,
}: {
  email: string;
  fullName: string;
  role: string;
}) {
  const t = useTranslations("settings");
  const accountMenuT = useTranslations("auth.accountMenu");
  const router = useRouter();
  const [name, setName] = useState(fullName);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleProfileSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSavingProfile(true);

    const { error } = await authClient.updateUser({ name: name.trim() });

    setIsSavingProfile(false);

    if (error) {
      toast.error(error.message || t("profile.error"));
      return;
    }

    toast.success(t("profile.updated"));
    router.refresh();
  }

  async function handlePasswordSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error(t("password.mismatch"));
      return;
    }

    setIsSavingPassword(true);

    const { error } = await authClient.changePassword({
      currentPassword,
      newPassword,
      revokeOtherSessions: true,
    });

    setIsSavingPassword(false);

    if (error) {
      toast.error(error.message || t("password.error"));
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    toast.success(t("password.updated"));
  }

  async function handleSignOut() {
    setIsSigningOut(true);
    await authClient.signOut();
    router.replace("/sign-in");
    router.refresh();
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t("profile.title")}</CardTitle>
          <CardDescription>{t("profile.description")}</CardDescription>
        </CardHeader>
        <form
          className="flex flex-col gap-(--card-spacing)"
          onSubmit={handleProfileSubmit}
        >
          <CardContent className="flex flex-col gap-4">
            <div className={FIELD}>
              <Label htmlFor="settings-name">{t("profile.name")}</Label>
              <Input
                autoComplete="name"
                className={INPUT}
                id="settings-name"
                onChange={(event) => setName(event.target.value)}
                placeholder={t("profile.namePlaceholder")}
                value={name}
              />
            </div>
            <div className={FIELD}>
              <Label htmlFor="settings-email">{t("profile.email")}</Label>
              <Input
                className={INPUT}
                disabled
                id="settings-email"
                value={email}
              />
            </div>
          </CardContent>
          <CardFooter className={FOOTER}>
            <p className="text-sm text-pretty text-muted-foreground">
              {t("profile.hint")}
            </p>
            <Button className={ACTION} disabled={isSavingProfile} type="submit">
              {isSavingProfile ? t("profile.saving") : t("profile.save")}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("password.title")}</CardTitle>
          <CardDescription>{t("password.description")}</CardDescription>
        </CardHeader>
        <form
          className="flex flex-col gap-(--card-spacing)"
          onSubmit={handlePasswordSubmit}
        >
          <CardContent className="flex flex-col gap-4">
            <div className={FIELD}>
              <Label htmlFor="current-password">{t("password.current")}</Label>
              <Input
                autoComplete="current-password"
                className={INPUT}
                id="current-password"
                onChange={(event) => setCurrentPassword(event.target.value)}
                required
                type="password"
                value={currentPassword}
              />
            </div>
            <div className={FIELD}>
              <Label htmlFor="new-password">{t("password.new")}</Label>
              <Input
                autoComplete="new-password"
                className={INPUT}
                id="new-password"
                minLength={8}
                onChange={(event) => setNewPassword(event.target.value)}
                required
                type="password"
                value={newPassword}
              />
            </div>
            <div className={FIELD}>
              <Label htmlFor="confirm-new-password">
                {t("password.confirm")}
              </Label>
              <Input
                autoComplete="new-password"
                className={INPUT}
                id="confirm-new-password"
                minLength={8}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
                type="password"
                value={confirmPassword}
              />
            </div>
          </CardContent>
          <CardFooter className={FOOTER}>
            <p className="text-sm text-pretty text-muted-foreground">
              {t("password.hint")}
            </p>
            <Button
              className={ACTION}
              disabled={isSavingPassword}
              type="submit"
            >
              {isSavingPassword
                ? t("password.submitting")
                : t("password.submit")}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("session.title")}</CardTitle>
          <CardDescription>{t("session.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-6 gap-y-3 text-sm md:max-w-md">
            <dt className="text-muted-foreground">{t("session.role")}</dt>
            <dd className="font-numeric">{role}</dd>
            <dt className="text-muted-foreground">{t("session.email")}</dt>
            <dd className="font-numeric break-all">{email}</dd>
          </dl>
        </CardContent>
        <CardFooter className={FOOTER}>
          <p className="text-sm text-pretty text-muted-foreground">
            {t("session.signOutHint")}
          </p>
          <Button
            className={ACTION}
            disabled={isSigningOut}
            onClick={() => void handleSignOut()}
            type="button"
            variant="outline"
          >
            <LogOut data-icon="inline-start" />
            {isSigningOut
              ? accountMenuT("signingOut")
              : accountMenuT("signOut")}
          </Button>
        </CardFooter>
      </Card>
    </>
  );
}
