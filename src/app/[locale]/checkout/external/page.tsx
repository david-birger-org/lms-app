import { Link2Off } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { CSSProperties } from "react";

import { PageState, PublicPage } from "@/components/auth/public-page";
import { ExternalCheckoutConfirm } from "@/components/checkout/external-checkout-confirm";
import { OrderSummary } from "@/components/checkout/order-summary";
import { resolveLocale } from "@/i18n/locale";
import { verifyExternalCheckoutToken } from "@/lib/server/external-checkout-token";

interface ExternalCheckoutSearchParams {
  payload?: string;
  sig?: string;
}

const actionEnter = { "--enter-index": 2 } as CSSProperties;

function formatPrice(minor: number) {
  return new Intl.NumberFormat("uk-UA", {
    currency: "UAH",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(minor / 100);
}

export default async function ExternalCheckoutPage({
  params: routeParams,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<ExternalCheckoutSearchParams>;
}) {
  const [{ locale }, params] = await Promise.all([routeParams, searchParams]);
  const t = await getTranslations({
    locale: resolveLocale(locale),
    namespace: "externalCheckout",
  });
  const payload = params.payload?.trim() ?? "";
  const sig = params.sig?.trim() ?? "";

  const verified = verifyExternalCheckoutToken({ payload, sig });
  if (!verified.ok)
    return (
      <PublicPage>
        <PageState
          description={t("invalidLink")}
          icon={Link2Off}
          title={t("invalidTitle")}
        />
      </PublicPage>
    );

  const priceLabel = formatPrice(verified.payload.amountMinor);

  return (
    <PublicPage className="pb-40 sm:pb-24">
      <div className="stagger flex w-full max-w-md flex-col gap-6">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl font-semibold tracking-tight text-balance">
            {t("title")}
          </h1>
          <p className="text-sm text-pretty text-muted-foreground">
            {t("description")}
          </p>
        </div>
        <OrderSummary
          label={t("summary")}
          rows={[
            { label: t("product"), value: t("productName") },
            {
              detail: verified.payload.customerEmail,
              label: t("customer"),
              value: verified.payload.customerName,
            },
          ]}
          total={priceLabel}
          totalLabel={t("total")}
        />
      </div>
      {/* Outside the stagger: an animated ancestor would pin the mobile bar to it. */}
      <div className="w-full max-w-md sm:animate-enter" style={actionEnter}>
        <ExternalCheckoutConfirm payload={payload} sig={sig} />
      </div>
    </PublicPage>
  );
}
