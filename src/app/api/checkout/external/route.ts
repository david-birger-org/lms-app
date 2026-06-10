import { NextResponse } from "next/server";

import { verifyExternalCheckoutToken } from "@/lib/server/external-checkout-token";
import { forwardLmsSlsRequest } from "@/lib/server/lms-sls";
import { requestOriginMatches } from "@/lib/server/request-security";

export async function POST(request: Request) {
  try {
    if (!requestOriginMatches(request)) {
      console.warn("external checkout rejected invalid origin", {
        origin: request.headers.get("origin"),
      });
      return NextResponse.json(
        { error: "Invalid request origin." },
        { status: 403 },
      );
    }

    const body = (await request.json().catch(() => null)) as {
      payload?: unknown;
      sig?: unknown;
    } | null;

    const payload = typeof body?.payload === "string" ? body.payload : "";
    const sig = typeof body?.sig === "string" ? body.sig : "";
    const verified = verifyExternalCheckoutToken({ payload, sig });

    if (!verified.ok) {
      console.warn("external checkout verification failed", {
        reason: verified.error,
      });
      return NextResponse.json({ error: verified.error }, { status: 400 });
    }

    console.info("external checkout forwarding to backend", {
      amountMinor: verified.payload.amountMinor,
      externalRef: verified.payload.externalRef,
      productSlug: verified.payload.productSlug,
    });

    const response = await forwardLmsSlsRequest({
      body: JSON.stringify({ payload, sig }),
      contentType: "application/json",
      method: "POST",
      path: "/api/external/checkout",
    });
    console.info("external checkout backend responded", {
      externalRef: verified.payload.externalRef,
      status: response.status,
    });
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    console.error("external checkout route failed", { error: message });
    return NextResponse.json(
      { error: `Failed to create external checkout: ${message}` },
      { status: 500 },
    );
  }
}
