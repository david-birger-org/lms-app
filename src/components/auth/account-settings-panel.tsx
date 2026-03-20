"use client";

import { KeyRound, LogOut, ShieldCheck, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

export function AccountSettingsPanel({
  email,
  fullName,
  role,
}: {
  email: string;
  fullName: string;
  role: string;
}) {
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

    const { error } = await authClient.updateUser({ name });

    setIsSavingProfile(false);

    if (error) {
      toast.error(error.message || "Failed to update your profile.");
      return;
    }

    toast.success("Profile updated.");
    router.refresh();
  }

  async function handlePasswordSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error("The new passwords do not match.");
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
      toast.error(error.message || "Failed to update your password.");
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    toast.success("Password updated.");
  }

  async function handleSignOut() {
    setIsSigningOut(true);
    await authClient.signOut();
    router.replace("/sign-in");
    router.refresh();
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
      <div className="grid gap-4">
        <Card className="shadow-xs">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <UserRound className="size-4" />
              Profile
            </CardTitle>
            <CardDescription>
              Update the display name used across the admin workspace.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form className="space-y-4" onSubmit={handleProfileSubmit}>
              <div className="space-y-2">
                <Label htmlFor="settings-name">Full name</Label>
                <Input
                  id="settings-name"
                  onChange={(event) => setName(event.target.value)}
                  required
                  value={name}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="settings-email">Email</Label>
                <Input disabled id="settings-email" value={email} />
              </div>
              <Button className="h-9" disabled={isSavingProfile} type="submit">
                {isSavingProfile ? "Saving..." : "Save profile"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <KeyRound className="size-4" />
              Password
            </CardTitle>
            <CardDescription>
              Change your password and revoke any other active sessions.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form className="space-y-4" onSubmit={handlePasswordSubmit}>
              <div className="space-y-2">
                <Label htmlFor="current-password">Current password</Label>
                <Input
                  autoComplete="current-password"
                  id="current-password"
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  required
                  type="password"
                  value={currentPassword}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">New password</Label>
                <Input
                  autoComplete="new-password"
                  id="new-password"
                  minLength={8}
                  onChange={(event) => setNewPassword(event.target.value)}
                  required
                  type="password"
                  value={newPassword}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-new-password">
                  Confirm new password
                </Label>
                <Input
                  autoComplete="new-password"
                  id="confirm-new-password"
                  minLength={8}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required
                  type="password"
                  value={confirmPassword}
                />
              </div>
              <Button className="h-9" disabled={isSavingPassword} type="submit">
                {isSavingPassword ? "Updating..." : "Update password"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card className="h-fit shadow-xs">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <ShieldCheck className="size-4" />
            Session
          </CardTitle>
          <CardDescription>
            This admin workspace is gated by Better Auth and the admin role.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="space-y-1 rounded-lg border bg-muted/20 p-4 text-sm">
            <p className="text-muted-foreground">Role</p>
            <p className="font-medium text-foreground">{role}</p>
          </div>
          <div className="space-y-1 rounded-lg border bg-muted/20 p-4 text-sm">
            <p className="text-muted-foreground">Email</p>
            <p className="break-all font-medium text-foreground">{email}</p>
          </div>
          <Button
            className="h-9 w-full"
            disabled={isSigningOut}
            onClick={() => void handleSignOut()}
            type="button"
            variant="outline"
          >
            <LogOut className="size-4" />
            {isSigningOut ? "Signing out..." : "Sign out"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
