"use client";

import { Bell } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type PermissionState =
  | "loading"
  | "unsupported"
  | "default"
  | "granted"
  | "denied";

type BadgeState = PermissionState | "disabled";

const APP_ENABLED_KEY = "settings:notifications:app-enabled";

function detectIOS() {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

function detectStandalone() {
  if (typeof window === "undefined") return false;
  if (window.matchMedia("(display-mode: standalone)").matches) return true;
  const nav = navigator as Navigator & { standalone?: boolean };
  return nav.standalone === true;
}

export function NotificationsSettingsCard() {
  const t = useTranslations("settings.notifications");
  const [permission, setPermission] = useState<PermissionState>("loading");
  const [appEnabled, setAppEnabled] = useState(false);
  const [open, setOpen] = useState(false);
  const [ios, setIos] = useState(false);
  const [standalone, setStandalone] = useState(false);

  useEffect(() => {
    setIos(detectIOS());
    setStandalone(detectStandalone());
    if (typeof window === "undefined" || typeof Notification === "undefined") {
      setPermission("unsupported");
      return;
    }
    setPermission(Notification.permission);
    setAppEnabled(window.localStorage.getItem(APP_ENABLED_KEY) === "true");
  }, []);

  const needsInstall = ios && !standalone;
  const isEnabled = permission === "granted" && appEnabled;
  const badgeState: BadgeState =
    permission === "granted" && !appEnabled ? "disabled" : permission;

  function persistEnabled(value: boolean) {
    setAppEnabled(value);
    window.localStorage.setItem(APP_ENABLED_KEY, value ? "true" : "false");
  }

  async function requestPermission() {
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result === "granted") {
        persistEnabled(true);
        new Notification(t("testTitle"), { body: t("testBody") });
        toast.success(t("enabledToast"));
        setOpen(false);
      } else if (result === "denied") {
        toast.error(t("deniedToast"));
      }
    } catch {
      toast.error(t("errorToast"));
    }
  }

  function handleEnableClick() {
    if (permission === "granted") {
      persistEnabled(true);
      toast.success(t("enabledToast"));
      return;
    }
    setOpen(true);
  }

  function handleDisableClick() {
    persistEnabled(false);
    toast.success(t("disabledToast"));
  }

  function sendTest() {
    try {
      new Notification(t("testTitle"), { body: t("testBody") });
    } catch {
      toast.error(t("errorToast"));
    }
  }

  const iosSteps = [
    t("modal.steps.iosInstall.shareMenu"),
    t("modal.steps.iosInstall.addToHome"),
    t("modal.steps.iosInstall.openInstalled"),
    t("modal.steps.iosInstall.allow"),
  ];
  const browserSteps = [
    t("modal.steps.browser.click"),
    t("modal.steps.browser.allow"),
  ];

  return (
    <Card className="shadow-xs">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Bell className="size-4" />
          {t("title")}
        </CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent className="pt-4 xl:pt-6">
        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge state={badgeState} />
          {isEnabled ? (
            <>
              <Button variant="destructive" onClick={handleDisableClick}>
                {t("buttons.disable")}
              </Button>
              <Button variant="outline" onClick={sendTest}>
                {t("buttons.test")}
              </Button>
            </>
          ) : (
            <Button
              onClick={handleEnableClick}
              disabled={permission === "unsupported"}
            >
              {t("buttons.enable")}
            </Button>
          )}
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm">
                {t("buttons.howTo")}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{t("modal.title")}</DialogTitle>
                <DialogDescription>
                  {needsInstall
                    ? t("modal.descriptionIos")
                    : t("modal.descriptionBrowser")}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <ol className="list-decimal space-y-2 pl-5 text-sm">
                  {(needsInstall ? iosSteps : browserSteps).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ol>
                {permission === "denied" ? (
                  <p className="rounded-md bg-destructive/10 p-3 text-xs text-destructive">
                    {t("modal.denied")}
                  </p>
                ) : null}
                {permission === "unsupported" ? (
                  <p className="rounded-md bg-muted p-3 text-xs text-muted-foreground">
                    {t("modal.unsupported")}
                  </p>
                ) : null}
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">{t("buttons.close")}</Button>
                </DialogClose>
                {!needsInstall &&
                permission !== "granted" &&
                permission !== "denied" &&
                permission !== "unsupported" ? (
                  <Button onClick={requestPermission}>
                    {t("buttons.enableNow")}
                  </Button>
                ) : null}
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ state }: { state: BadgeState }) {
  const t = useTranslations("settings.notifications.status");
  const label =
    state === "granted"
      ? t("granted")
      : state === "disabled"
        ? t("disabled")
        : state === "denied"
          ? t("denied")
          : state === "unsupported"
            ? t("unsupported")
            : state === "default"
              ? t("default")
              : t("loading");
  const tone =
    state === "granted"
      ? "bg-green-500/15 text-green-700 dark:text-green-400"
      : state === "denied"
        ? "bg-red-500/15 text-red-700 dark:text-red-400"
        : "bg-muted text-muted-foreground";
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${tone}`}
    >
      {label}
    </span>
  );
}
