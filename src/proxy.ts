import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";

const PUBLIC_PATH_PREFIXES = [
  "/api/auth",
  "/sign-in",
  "/sign-up",
  "/unauthorized",
];

function isPublicRoute(request: NextRequest) {
  return PUBLIC_PATH_PREFIXES.some(
    (prefix) =>
      request.nextUrl.pathname === prefix ||
      request.nextUrl.pathname.startsWith(`${prefix}/`),
  );
}

export function proxy(request: NextRequest) {
  if (isPublicRoute(request)) {
    return NextResponse.next();
  }

  if (!getSessionCookie(request)) {
    const signInUrl = new URL("/sign-in", request.url);
    const redirectPath =
      request.nextUrl.pathname + (request.nextUrl.search || "");
    signInUrl.searchParams.set("redirect_url", redirectPath);

    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)", "/(api|trpc)(.*)"],
};
