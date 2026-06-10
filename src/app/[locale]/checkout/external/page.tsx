import { ExternalCheckoutPageContent } from "@/app/checkout/external/page";
import { resolveLocale } from "@/i18n/locale";

export default async function LocalizedExternalCheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ payload?: string; sig?: string }>;
}) {
  const { locale } = await params;

  return (
    <ExternalCheckoutPageContent
      locale={resolveLocale(locale)}
      searchParams={searchParams}
    />
  );
}
