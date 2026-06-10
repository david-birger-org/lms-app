import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

import { env } from "@/lib/env";

export const EXTERNAL_PARTICIPATION_PRODUCT_SLUG = "participation-fee";

export interface ExternalCheckoutPayload {
  amountMinor: number;
  currency: "UAH";
  customerEmail: string;
  customerName: string;
  exp: number;
  externalRef: string;
  nonce: string;
  productSlug: typeof EXTERNAL_PARTICIPATION_PRODUCT_SLUG;
  returnUrl?: string;
}

interface VerifyResultOk {
  ok: true;
  payload: ExternalCheckoutPayload;
}

interface VerifyResultError {
  error: string;
  ok: false;
}

export type VerifyExternalCheckoutResult = VerifyResultOk | VerifyResultError;

function decodeBase64Url(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signPayload(payload: string) {
  return createHmac("sha256", env.wnbfCheckoutSecret)
    .update(payload)
    .digest("base64url");
}

function signaturesMatch(payload: string, signature: string) {
  const expected = signPayload(payload);
  const actualBuffer = Buffer.from(signature, "utf8");
  const expectedBuffer = Buffer.from(expected, "utf8");

  if (actualBuffer.length !== expectedBuffer.length) return false;
  return timingSafeEqual(actualBuffer, expectedBuffer);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validAbsoluteUrl(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

function validatePayload(parsed: unknown): VerifyExternalCheckoutResult {
  if (!isRecord(parsed))
    return { error: "Payload must be an object.", ok: false };

  if (parsed.productSlug !== EXTERNAL_PARTICIPATION_PRODUCT_SLUG)
    return {
      error: `productSlug must be ${EXTERNAL_PARTICIPATION_PRODUCT_SLUG}.`,
      ok: false,
    };

  if (
    typeof parsed.amountMinor !== "number" ||
    !Number.isSafeInteger(parsed.amountMinor) ||
    parsed.amountMinor <= 0
  )
    return { error: "amountMinor must be a positive integer.", ok: false };

  if (parsed.currency !== "UAH")
    return { error: "currency must be UAH.", ok: false };

  if (
    typeof parsed.customerName !== "string" ||
    parsed.customerName.trim().length === 0
  )
    return { error: "customerName is required.", ok: false };

  if (
    typeof parsed.customerEmail !== "string" ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(parsed.customerEmail.trim())
  )
    return { error: "customerEmail must be a valid email.", ok: false };

  if (
    typeof parsed.externalRef !== "string" ||
    parsed.externalRef.trim().length === 0
  )
    return { error: "externalRef is required.", ok: false };

  if (typeof parsed.nonce !== "string" || parsed.nonce.trim().length === 0)
    return { error: "nonce is required.", ok: false };

  if (
    typeof parsed.exp !== "number" ||
    !Number.isSafeInteger(parsed.exp) ||
    parsed.exp <= Math.floor(Date.now() / 1000)
  )
    return { error: "Checkout payload expired.", ok: false };

  if (
    parsed.returnUrl !== undefined &&
    (typeof parsed.returnUrl !== "string" ||
      !validAbsoluteUrl(parsed.returnUrl))
  )
    return { error: "returnUrl must be an absolute http(s) URL.", ok: false };

  const returnUrl =
    typeof parsed.returnUrl === "string" ? parsed.returnUrl.trim() : undefined;

  return {
    ok: true,
    payload: {
      amountMinor: parsed.amountMinor,
      currency: "UAH",
      customerEmail: parsed.customerEmail.trim(),
      customerName: parsed.customerName.trim(),
      exp: parsed.exp,
      externalRef: parsed.externalRef.trim(),
      nonce: parsed.nonce.trim(),
      productSlug: EXTERNAL_PARTICIPATION_PRODUCT_SLUG,
      returnUrl,
    },
  };
}

export function verifyExternalCheckoutToken({
  payload,
  sig,
}: {
  payload: string;
  sig: string;
}): VerifyExternalCheckoutResult {
  const payloadValue = payload.trim();
  const signature = sig.trim();

  if (!payloadValue || !signature)
    return { error: "payload and sig are required.", ok: false };
  if (!signaturesMatch(payloadValue, signature))
    return { error: "Invalid checkout signature.", ok: false };

  try {
    return validatePayload(JSON.parse(decodeBase64Url(payloadValue)));
  } catch {
    return { error: "Invalid checkout payload.", ok: false };
  }
}

export function buildExternalCheckoutUrl(
  requestUrl: string,
  payload: string,
  sig: string,
) {
  const url = new URL("/checkout/external", requestUrl);
  url.searchParams.set("payload", payload.trim());
  url.searchParams.set("sig", sig.trim());
  return url.toString();
}
