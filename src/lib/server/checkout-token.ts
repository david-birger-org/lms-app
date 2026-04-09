import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

import type { Locale } from "@/i18n/config";
import { isLocale } from "@/i18n/locale";
import { env } from "@/lib/env";

export type CheckoutCurrency = "UAH" | "USD";

interface CheckoutTokenPayload {
  currency: CheckoutCurrency;
  exp: number;
  locale: Locale | null;
  productSlug: string;
  userId: string;
  v: 1;
}

const CHECKOUT_TOKEN_TTL_SECONDS = 10 * 60;

function encodeBase64Url(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function decodeBase64Url(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signCheckoutToken(payload: string) {
  return createHmac("sha256", env.betterAuthSecret)
    .update(payload)
    .digest("base64url");
}

export function createCheckoutToken({
  currency,
  locale,
  productSlug,
  userId,
}: {
  currency: CheckoutCurrency;
  locale?: string;
  productSlug: string;
  userId: string;
}) {
  const payload = encodeBase64Url(
    JSON.stringify({
      currency,
      exp: Math.floor(Date.now() / 1000) + CHECKOUT_TOKEN_TTL_SECONDS,
      locale: locale && isLocale(locale) ? locale : null,
      productSlug,
      userId,
      v: 1,
    } satisfies CheckoutTokenPayload),
  );

  return `${payload}.${signCheckoutToken(payload)}`;
}

export function verifyCheckoutToken(token: string) {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const expectedSignature = signCheckoutToken(payload);
  const actualBuffer = Buffer.from(signature, "utf8");
  const expectedBuffer = Buffer.from(expectedSignature, "utf8");
  if (actualBuffer.length !== expectedBuffer.length) return null;
  if (!timingSafeEqual(actualBuffer, expectedBuffer)) return null;

  try {
    const parsed = JSON.parse(
      decodeBase64Url(payload),
    ) as Partial<CheckoutTokenPayload>;
    if (parsed.v !== 1) return null;
    if (typeof parsed.userId !== "string" || parsed.userId.trim().length === 0)
      return null;
    if (parsed.currency !== "UAH" && parsed.currency !== "USD") return null;
    if (
      typeof parsed.productSlug !== "string" ||
      parsed.productSlug.trim().length === 0
    )
      return null;
    if (typeof parsed.exp !== "number" || parsed.exp < Date.now() / 1000)
      return null;
    if (
      parsed.locale !== null &&
      parsed.locale !== undefined &&
      !isLocale(parsed.locale)
    )
      return null;

    return {
      currency: parsed.currency,
      locale: parsed.locale ?? null,
      productSlug: parsed.productSlug,
      userId: parsed.userId,
    } satisfies Omit<CheckoutTokenPayload, "exp" | "v">;
  } catch {
    return null;
  }
}
