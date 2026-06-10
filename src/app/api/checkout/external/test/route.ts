import { NextResponse } from "next/server";

import {
  buildExternalCheckoutUrl,
  verifyExternalCheckoutToken,
} from "@/lib/server/external-checkout-token";

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

function responseFor(request: Request, payload: string, sig: string) {
  const verified = verifyExternalCheckoutToken({ payload, sig });

  if (!verified.ok)
    return NextResponse.json(
      {
        error: verified.error,
        ok: false,
      },
      { status: 400 },
    );

  return NextResponse.json({
    checkoutUrl: buildExternalCheckoutUrl(request.url, payload, sig),
    ok: true,
    payload: verified.payload,
  });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  return responseFor(
    request,
    url.searchParams.get("payload") ?? "",
    url.searchParams.get("sig") ?? "",
  );
}

export async function POST(request: Request) {
  const raw = await request.json().catch(() => null);
  const { payload, sig } = parseBody(raw);
  return responseFor(request, payload, sig);
}
