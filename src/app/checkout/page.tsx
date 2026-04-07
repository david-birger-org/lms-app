import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { CheckoutConfirm } from "@/components/checkout/checkout-confirm";
import { resolveLocale } from "@/i18n/locale";
import { getAuth } from "@/lib/auth/better-auth";
import { createCheckoutToken } from "@/lib/server/checkout-token";
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

function buildLocalizedPath(path: string, locale?: string) {
  if (!locale) return path;
  return `/${locale}${path}`;
}

async function fetchProductBySlug(
  slug: string,
): Promise<ProductPayload | null> {
  const response = await forwardLmsSlsRequest({
    method: "GET",
    path: "/api/products",
    search: `?slug=${encodeURIComponent(slug)}`,
  });

  const payload = response.ok
    ? ((await response.json().catch(() => null)) as {
        product?: ProductPayload;
        products?: ProductPayload[];
      } | null)
    : null;

  if (payload?.product) return payload.product;

  const directProducts = Array.isArray(payload?.products)
    ? payload.products
    : [];
  const directMatch = directProducts.find((product) => product.slug === slug);
  if (directMatch) return directMatch;

  const listResponse = await forwardLmsSlsRequest({
    method: "GET",
    path: "/api/products",
  });
  if (!listResponse.ok) return null;

  const listPayload = (await listResponse.json().catch(() => null)) as {
    product?: ProductPayload;
    products?: ProductPayload[];
  } | null;

  if (listPayload?.product?.slug === slug) return listPayload.product;

  const products = Array.isArray(listPayload?.products)
    ? listPayload.products
    : [];
  return products.find((product) => product.slug === slug) ?? null;
}

function formatPrice(minor: number, currency: "UAH" | "USD") {
  const major = minor / 100;
  return new Intl.NumberFormat(currency === "UAH" ? "uk-UA" : "en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: major % 1 === 0 ? 0 : 2,
  }).format(major);
}

export async function CheckoutPageContent({
  locale,
  searchParams,
}: {
  locale?: string;
  searchParams: Promise<CheckoutSearchParams>;
}) {
  const params = await searchParams;
  const resolvedLocale = resolveLocale(locale);
  const t = await getTranslations({
    locale: resolvedLocale,
    namespace: "checkout",
  });
  const slug = params.product?.trim();

  if (!slug)
    return (
      <main className="flex min-h-svh items-center justify-center p-6">
        <p className="text-sm text-muted-foreground">{t("missingProduct")}</p>
      </main>
    );

  const currency: "UAH" | "USD" = params.c === "UAH" ? "UAH" : "USD";
  const returnPath = buildLocalizedPath(
    `/checkout?product=${encodeURIComponent(slug)}&c=${currency}`,
    locale,
  );

  const session = await getAuth().api.getSession({ headers: await headers() });
  if (!session) {
    redirect(
      `${buildLocalizedPath("/sign-up", locale)}?redirect_url=${encodeURIComponent(returnPath)}`,
    );
  }

  const product = await fetchProductBySlug(slug);
  if (!product?.active || product.pricingType !== "fixed")
    return (
      <main className="flex min-h-svh items-center justify-center p-6">
        <p className="text-sm text-muted-foreground">{t("notAvailable")}</p>
      </main>
    );

  const priceMinor =
    currency === "UAH" ? product.priceUahMinor : product.priceUsdMinor;
  if (priceMinor === null)
    return (
      <main className="flex min-h-svh items-center justify-center p-6">
        <p className="text-sm text-muted-foreground">
          {t("missingPrice", { currency })}
        </p>
      </main>
    );

  const productName = resolvedLocale === "ua" ? product.nameUk : product.nameEn;
  const priceLabel = formatPrice(priceMinor, currency);
  const checkoutToken = createCheckoutToken({
    currency,
    locale: resolvedLocale,
    productSlug: slug,
    userId: session.user.id,
  });

  return (
    <main className="flex min-h-svh items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.08),_transparent_45%),linear-gradient(180deg,_rgba(255,255,255,1),_rgba(248,250,252,1))] px-4 py-10">
      <div className="w-full max-w-md rounded-xl border bg-background p-6 shadow-sm">
        <h1 className="text-xl font-semibold">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("signedInAs", { email: session.user.email ?? "" })}
        </p>
        <div className="mt-6 space-y-2">
          <div className="text-sm text-muted-foreground">{t("product")}</div>
          <div className="text-base font-medium">{productName}</div>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{t("total")}</span>
          <span className="text-lg font-semibold">{priceLabel}</span>
        </div>
        <div className="mt-6">
          <CheckoutConfirm checkoutToken={checkoutToken} />
        </div>
      </div>
    </main>
  );
}

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<CheckoutSearchParams>;
}) {
  return <CheckoutPageContent searchParams={searchParams} />;
}
