"use client";

import { BookOpen, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";

interface ActiveFeature {
  feature: string;
  grantedAt: string;
}

interface FeaturesResponse {
  features?: ActiveFeature[];
  error?: string;
}

const KNOWN_FEATURES = [{ key: "lectures", icon: BookOpen }] as const;

export function UserFeaturesManager({ authUserId }: { authUserId: string }) {
  const t = useTranslations("admin.users.features");
  const [features, setFeatures] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [togglingFeature, setTogglingFeature] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    setIsLoading(true);
    fetch(`/api/admin/users/purchases?userId=${encodeURIComponent(authUserId)}`)
      .then((r) => r.json() as Promise<FeaturesResponse>)
      .then((data) => {
        if (!isMountedRef.current) return;
        const active = new Set((data.features ?? []).map((f) => f.feature));
        setFeatures(active);
      })
      .catch(() => {})
      .finally(() => {
        if (isMountedRef.current) setIsLoading(false);
      });
  }, [authUserId]);

  const toggleFeature = useCallback(
    async (feature: string, grant: boolean) => {
      setTogglingFeature(feature);

      try {
        const response = await fetch("/api/admin/users/features", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: grant ? "grant-feature" : "revoke-feature",
            authUserId,
            feature,
          }),
        });
        const payload = (await response.json()) as FeaturesResponse;

        if (!isMountedRef.current) return;

        if (!response.ok) throw new Error(payload.error ?? "Failed");

        const active = new Set((payload.features ?? []).map((f) => f.feature));
        setFeatures(active);
      } catch {
        if (!isMountedRef.current) return;
      } finally {
        if (isMountedRef.current) setTogglingFeature(null);
      }
    },
    [authUserId],
  );

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium">{t("title")}</p>
      <div className="divide-y rounded-lg border">
        {KNOWN_FEATURES.map(({ key, icon: Icon }) => {
          const isActive = features.has(key);
          const isToggling = togglingFeature === key;
          const switchId = `feature-${key}`;

          return (
            <div
              key={key}
              className="flex min-h-14 items-center justify-between gap-3 px-3 py-2"
            >
              <label
                htmlFor={switchId}
                className="flex min-w-0 items-center gap-2.5 text-sm"
              >
                <Icon className="size-4 shrink-0 text-muted-foreground" />
                {t(key)}
              </label>
              {isLoading ? (
                <>
                  <span className="sr-only">{t("loading")}</span>
                  <Skeleton className="h-[18.4px] w-8 rounded-full" />
                </>
              ) : (
                <div className="flex items-center gap-2">
                  {isToggling ? (
                    <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
                  ) : null}
                  <Switch
                    id={switchId}
                    checked={isActive}
                    onCheckedChange={(checked) =>
                      void toggleFeature(key, checked as boolean)
                    }
                    disabled={isToggling}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
