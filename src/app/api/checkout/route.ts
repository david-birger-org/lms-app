import { NextResponse } from "next/server";

import { requireAuthApiAccess } from "@/lib/auth/auth-server";
import { verifyCheckoutToken } from "@/lib/server/checkout-token";
import {
  forwardLmsSlsRequest,
  getForwardedSessionHeaders,
  mergeHeaders,
} from "@/lib/server/lms-sls";
import {
  buildAllowedRedirectUrl,
  requestOriginMatches,
} from "@/lib/server/request-security";
import { createTrustedUserHeaders } from "@/lib/server/lms-sls-user";

export async function POST(request: Request) {
  try {
    if (!requestOriginMatches(request))
      return NextResponse.json(
        { error: "Invalid request origin." },
        { status: 403 },
      );

    const access = await requireAuthApiAccess(request);
    if (!access.ok) return access.response;

    const body = (await request.json().catch(() => null)) as {
      checkoutToken?: unknown;
    } | null;

    if (!body || typeof body !== "object")
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 },
      );

    const tokenValue =
      typeof body.checkoutToken === "string" ? body.checkoutToken.trim() : "";
    if (!tokenValue)
      return NextResponse.json(
        { error: "checkoutToken is required." },
        { status: 400 },
      );

    const checkoutToken = verifyCheckoutToken(tokenValue);
    if (
      !checkoutToken ||
      checkoutToken.userId !== access.authenticatedUser.userId
    )
      return NextResponse.json(
        { error: "Invalid checkout token." },
        { status: 403 },
      );

    return await forwardLmsSlsRequest({
      body: JSON.stringify({
        currency: checkoutToken.currency,
        productSlug: checkoutToken.productSlug,
        redirectUrl: buildAllowedRedirectUrl(request, checkoutToken.locale),
      }),
      contentType: "application/json",
      headers: mergeHeaders(
        createTrustedUserHeaders(access.authenticatedUser),
        getForwardedSessionHeaders(request.headers),
      ),
      method: "POST",
      path: "/api/user/checkout",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json(
      { error: `Failed to create checkout: ${message}` },
      { status: 500 },
    );
  }
}
