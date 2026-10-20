"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { CheckoutActionBar } from "@/components/checkout/order-summary";

interface CheckoutConfirmProps {
  checkoutToken: string;
}

export function CheckoutConfirm({ checkoutToken }: CheckoutConfirmProps) {
  const t = useTranslations("checkout");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ checkoutToken }),
      });

      const data = (await response.json().catch(() => null)) as {
        pageUrl?: string;
      } | null;

      if (!response.ok || !data?.pageUrl) {
        setError(t("createCheckoutError"));
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
