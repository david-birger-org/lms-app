"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { CheckoutActionBar } from "@/components/checkout/order-summary";

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
    <CheckoutActionBar
      error={error}
      isSubmitting={isSubmitting}
      label={t("proceedToPayment")}
      note={t("secureNote")}
      onConfirm={() => void handleClick()}
      submittingLabel={t("creatingInvoice")}
    />
  );
}
