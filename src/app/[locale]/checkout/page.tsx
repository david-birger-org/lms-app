import { PackageX } from "lucide-react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import type { CSSProperties } from "react";

import { PageState, PublicPage } from "@/components/auth/public-page";
import { CheckoutConfirm } from "@/components/checkout/checkout-confirm";
import { OrderSummary } from "@/components/checkout/order-summary";
import { Button } from "@/components/ui/button";
import { resolveLocale } from "@/i18n/locale";
import { Link } from "@/i18n/routing";
import { getAuth } from "@/lib/auth/better-auth";
import {
  type CheckoutCurrency,
  createCheckoutToken,
} from "@/lib/server/checkout-token";
import { forwardLmsSlsRequest } from "@/lib/server/lms-sls";

interface CheckoutSearchParams {
  product?: string;
  c?: string;
}

interface ProductPayload {
  id: string;
  slug: string;
  nameUk: string;
  nameEn: string;
  pricingType: "fixed" | "on_request";
  priceUahMinor: number | null;
  priceUsdMinor: number | null;
  imageUrl: string | null;
  active: boolean;
}

const actionEnter = { "--enter-index": 2 } as CSSProperties;

async function fetchProductBySlug(
  slug: string,
): Promise<ProductPayload | null> {
  const response = await forwardLmsSlsRequest({
    method: "GET",
    path: "/api/products",
    search: `?slug=${encodeURIComponent(slug)}`,
  });

  if (!response.ok) return null;

  const payload = (await response.json().catch(() => null)) as {
    product?: ProductPayload | null;
  } | null;

  return payload?.product ?? null;
}

function formatPrice(minor: number, currency: CheckoutCurrency) {
  const major = minor / 100;
  return new Intl.NumberFormat(currency === "UAH" ? "uk-UA" : "en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: major % 1 === 0 ? 0 : 2,
  }).format(major);
}

export default async function CheckoutPage({
  params: routeParams,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<CheckoutSearchParams>;
}) {
  const [{ locale }, params] = await Promise.all([routeParams, searchParams]);
  const resolvedLocale = resolveLocale(locale);
  const t = await getTranslations({
    locale: resolvedLocale,
    namespace: "checkout",
  });
  const slug = params.product?.trim();

  const unavailable = (message: string) => (
    <PublicPage>
      <PageState
        actions={
          <Button asChild size="lg" variant="outline">
            <Link href="/dashboard">{t("backToDashboard")}</Link>
          </Button>
        }
        description={message}
        icon={PackageX}
        title={t("unavailableTitle")}
      />
    </PublicPage>
  );

  if (!slug) return unavailable(t("missingProduct"));

  const requestedCurrency = params.c?.trim().toUpperCase();
  if (requestedCurrency !== "UAH" && requestedCurrency !== "USD")
    return unavailable(t("notAvailable"));

  const currency: CheckoutCurrency = requestedCurrency;
  const returnPath = `/${resolvedLocale}/checkout?product=${encodeURIComponent(slug)}&c=${currency}`;

  const session = await getAuth().api.getSession({ headers: await headers() });
  if (!session) {
    redirect(
      `/${resolvedLocale}/sign-up?redirect_url=${encodeURIComponent(returnPath)}`,
    );
  }

  const product = await fetchProductBySlug(slug);
  if (!product?.active || product.pricingType !== "fixed")
    return unavailable(t("notAvailable"));

  const priceMinor =
    currency === "UAH" ? product.priceUahMinor : product.priceUsdMinor;
  if (priceMinor === null) return unavailable(t("missingPrice", { currency }));

  const productName = resolvedLocale === "ua" ? product.nameUk : product.nameEn;
  const priceLabel = formatPrice(priceMinor, currency);
  const checkoutToken = createCheckoutToken({
    currency,
    locale: resolvedLocale,
    productSlug: slug,
    userId: session.user.id,
  });

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
            { label: t("product"), value: productName },
            { label: t("account"), value: session.user.email ?? "" },
          ]}
          total={priceLabel}
          totalLabel={t("total")}
        />
      </div>
      {/* Outside the stagger: an animated ancestor would pin the mobile bar to it. */}
      <div className="w-full max-w-md sm:animate-enter" style={actionEnter}>
        <CheckoutConfirm checkoutToken={checkoutToken} />
      </div>
    </PublicPage>
  );
}
