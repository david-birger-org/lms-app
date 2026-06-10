import { NextResponse } from "next/server";

import { verifyExternalCheckoutToken } from "@/lib/server/external-checkout-token";
import { forwardLmsSlsRequest } from "@/lib/server/lms-sls";
import { requestOriginMatches } from "@/lib/server/request-security";

export async function POST(request: Request) {
  try {
    if (!requestOriginMatches(request))
      return NextResponse.json(
        { error: "Invalid request origin." },
        { status: 403 },
      );

    const body = (await request.json().catch(() => null)) as {
      payload?: unknown;
      sig?: unknown;
    } | null;

    const payload = typeof body?.payload === "string" ? body.payload : "";
    const sig = typeof body?.sig === "string" ? body.sig : "";
    const verified = verifyExternalCheckoutToken({ payload, sig });

    if (!verified.ok)
      return NextResponse.json({ error: verified.error }, { status: 400 });

    return await forwardLmsSlsRequest({
      body: JSON.stringify({ payload, sig }),
      contentType: "application/json",
      method: "POST",
      path: "/api/external/checkout",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json(
      { error: `Failed to create external checkout: ${message}` },
      { status: 500 },
    );
  }
}
