import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const CLERK_ACCOUNTS_HOST = "accounts.admin.davidbirger.com";

const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/unauthorized",
]);

export default clerkMiddleware(async (auth, request) => {
  if (request.nextUrl.hostname === CLERK_ACCOUNTS_HOST) {
    return;
  }

  if (!isPublicRoute(request)) {
    const { redirectToSignIn, userId } = await auth();

    if (!userId) {
      return redirectToSignIn();
    }
  }
});

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)", "/(api|trpc)(.*)"],
};
