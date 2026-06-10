import { getTranslations } from "next-intl/server";

import { ExternalCheckoutConfirm } from "@/components/checkout/external-checkout-confirm";
import { resolveLocale } from "@/i18n/locale";
import { verifyExternalCheckoutToken } from "@/lib/server/external-checkout-token";

interface ExternalCheckoutSearchParams {
  payload?: string;
  sig?: string;
}

function formatPrice(minor: number) {
  return new Intl.NumberFormat("uk-UA", {
    currency: "UAH",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(minor / 100);
}

function ErrorState({ message }: { message: string }) {
  return (
    <main className="flex min-h-svh items-center justify-center p-6">
      <p className="max-w-md rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
        {message}
      </p>
    </main>
  );
}

export async function ExternalCheckoutPageContent({
  locale,
  searchParams,
}: {
  locale?: string;
  searchParams: Promise<ExternalCheckoutSearchParams>;
}) {
  const resolvedLocale = resolveLocale(locale);
  const t = await getTranslations({
    locale: resolvedLocale,
    namespace: "externalCheckout",
  });
  const params = await searchParams;
  const payload = params.payload?.trim() ?? "";
  const sig = params.sig?.trim() ?? "";

  const verified = verifyExternalCheckoutToken({ payload, sig });
  if (!verified.ok) return <ErrorState message={t("invalidLink")} />;

  const priceLabel = formatPrice(verified.payload.amountMinor);

  return (
    <main className="flex min-h-svh items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.08),_transparent_45%),linear-gradient(180deg,_rgba(255,255,255,1),_rgba(248,250,252,1))] px-4 py-10">
      <div className="w-full max-w-md rounded-xl border bg-background p-6 shadow-sm">
        <h1 className="text-xl font-semibold">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("description")}</p>
        <div className="mt-6 space-y-2">
          <div className="text-sm text-muted-foreground">{t("product")}</div>
          <div className="text-base font-medium">{t("productName")}</div>
        </div>
        <div className="mt-4 space-y-2">
          <div className="text-sm text-muted-foreground">{t("customer")}</div>
          <div className="text-base font-medium">
            {verified.payload.customerName}
          </div>
          <div className="text-sm text-muted-foreground">
            {verified.payload.customerEmail}
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{t("total")}</span>
          <span className="text-lg font-semibold">{priceLabel}</span>
        </div>
        <div className="mt-6">
          <ExternalCheckoutConfirm payload={payload} sig={sig} />
        </div>
      </div>
    </main>
  );
}

export default async function ExternalCheckoutPage({
  searchParams,
}: {
  searchParams: Promise<ExternalCheckoutSearchParams>;
}) {
  return <ExternalCheckoutPageContent searchParams={searchParams} />;
}
