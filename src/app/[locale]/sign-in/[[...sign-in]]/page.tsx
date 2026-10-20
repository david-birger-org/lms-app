import { SignInForm } from "@/components/auth/sign-in-form";
import { redirect } from "@/i18n/routing";

function shouldRedirectToSignUp(
  searchParams: Record<string, string | string[] | undefined>,
) {
  const product =
    typeof searchParams.product === "string" ? searchParams.product.trim() : "";
  const slug =
    typeof searchParams.slug === "string" ? searchParams.slug.trim() : "";
  const redirectUrl =
    typeof searchParams.redirect_url === "string"
      ? searchParams.redirect_url.trim()
      : "";

  return Boolean(product || slug || redirectUrl.includes("product="));
}

function buildSignUpQuery(
  searchParams: Record<string, string | string[] | undefined>,
) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (typeof value === "string") params.set(key, value);
    else if (Array.isArray(value))
      value.forEach((item) => {
        params.append(key, item);
      });
  }

  return params.toString();
}

export default async function LocalizedSignInPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ locale }, resolvedSearchParams] = await Promise.all([
    params,
    searchParams,
  ]);

  if (shouldRedirectToSignUp(resolvedSearchParams)) {
    const query = buildSignUpQuery(resolvedSearchParams);
    redirect({ href: query ? `/sign-up?${query}` : "/sign-up", locale });
  }

  return <SignInForm />;
}
