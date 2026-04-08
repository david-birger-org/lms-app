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

  return (
    <main className="flex min-h-svh items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.08),_transparent_45%),linear-gradient(180deg,_rgba(255,255,255,1),_rgba(248,250,252,1))] px-4 py-10">
      <SignInForm />
    </main>
  );
}
