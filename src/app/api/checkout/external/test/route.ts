import { NextResponse } from "next/server";

import {
  buildExternalCheckoutUrl,
  verifyExternalCheckoutToken,
} from "@/lib/server/external-checkout-token";
import { forwardLmsSlsRequest } from "@/lib/server/lms-sls";

function parseBody(value: unknown) {
  if (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    typeof (value as { payload?: unknown }).payload === "string" &&
    typeof (value as { sig?: unknown }).sig === "string"
  )
    return {
      payload: (value as { payload: string }).payload,
      sig: (value as { sig: string }).sig,
    };

  return { payload: "", sig: "" };
}

function dryRunResponse(request: Request, payload: string, sig: string) {
  const verified = verifyExternalCheckoutToken({ payload, sig });

  if (!verified.ok) {
    console.warn("external checkout test validation failed", {
      reason: verified.error,
    });
    return NextResponse.json(
      {
        error: verified.error,
        ok: false,
      },
      { status: 400 },
    );
  }

  console.info("external checkout test validation ok", {
    amountMinor: verified.payload.amountMinor,
    externalRef: verified.payload.externalRef,
    productSlug: verified.payload.productSlug,
  });
  return NextResponse.json({
    checkoutUrl: buildExternalCheckoutUrl(request.url, payload, sig),
    mode: "dry-run",
    ok: true,
    payload: verified.payload,
  });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  return dryRunResponse(
    request,
    url.searchParams.get("payload") ?? "",
    url.searchParams.get("sig") ?? "",
  );
}

export async function POST(request: Request) {
  try {
    const raw = await request.json().catch(() => null);
    const { payload, sig } = parseBody(raw);
    const verified = verifyExternalCheckoutToken({ payload, sig });

    if (!verified.ok) {
      console.warn("external checkout test invoice verification failed", {
        reason: verified.error,
      });
      return NextResponse.json(
        { error: verified.error, ok: false },
        { status: 400 },
      );
    }

    console.info("external checkout test invoice forwarding to backend", {
      amountMinor: verified.payload.amountMinor,
      externalRef: verified.payload.externalRef,
      productSlug: verified.payload.productSlug,
    });
    const response = await forwardLmsSlsRequest({
      body: JSON.stringify({ payload, sig }),
      contentType: "application/json",
      method: "POST",
      path: "/api/external/checkout/test",
    });
    console.info("external checkout test invoice backend responded", {
      externalRef: verified.payload.externalRef,
      status: response.status,
    });
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    console.error("external checkout test invoice route failed", {
      error: message,
    });
    return NextResponse.json(
      { error: `Failed to create test checkout: ${message}`, ok: false },
      { status: 500 },
    );
  }
}
