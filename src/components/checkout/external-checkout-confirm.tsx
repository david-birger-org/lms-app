"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";

interface ExternalCheckoutConfirmProps {
  payload: string;
  sig: string;
}

export function ExternalCheckoutConfirm({
  payload,
  sig,
}: ExternalCheckoutConfirmProps) {
  const t = useTranslations("externalCheckout");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/checkout/external", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ payload, sig }),
      });

      const data = (await response.json().catch(() => null)) as {
        error?: string;
        pageUrl?: string;
      } | null;

      if (!response.ok || !data?.pageUrl) {
        setError(
          typeof data?.error === "string" && data.error.trim() !== ""
            ? data.error
            : t("createCheckoutError"),
        );
        setIsSubmitting(false);
        return;
      }

      window.location.href = data.pageUrl;
    } catch {
      setError(t("createCheckoutError"));
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-3">
      <Button className="w-full" disabled={isSubmitting} onClick={handleClick}>
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" />
            {t("creatingInvoice")}
          </>
        ) : (
          t("proceedToPayment")
        )}
      </Button>
      {error ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
