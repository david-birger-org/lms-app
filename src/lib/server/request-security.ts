import "server-only";

import type { Locale } from "@/i18n/config";
import { env } from "@/lib/env";

function normalizeOrigin(value: string) {
  return new URL(value).origin;
}

function readCsv(value: string | null) {
  if (!value) return [];

  return value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

export function getAllowedOrigins() {
  return new Set(
    [
      env.betterAuthUrl,
      "http://localhost:3000",
      ...readCsv(env.betterAuthTrustedOrigins),
    ].map(normalizeOrigin),
  );
}

export function isAllowedOrigin(origin: string) {
  try {
    return getAllowedOrigins().has(normalizeOrigin(origin));
  } catch {
    return false;
  }
}

export function requestOriginMatches(request: Request) {
  const originHeader = request.headers.get("origin")?.trim();
  if (!originHeader) return false;

  try {
    const requestOrigin = new URL(request.url).origin;
    const normalizedOrigin = normalizeOrigin(originHeader);
    return (
      normalizedOrigin === requestOrigin && isAllowedOrigin(normalizedOrigin)
    );
  } catch {
    return false;
  }
}

export function buildAllowedRedirectUrl(
  request: Request,
  locale: Locale | null,
) {
  const requestOrigin = new URL(request.url).origin;
  if (!isAllowedOrigin(requestOrigin))
    throw new Error("Checkout origin is not allowed.");

  const pathname = locale
    ? `/${locale}/dashboard/purchases`
    : "/dashboard/purchases";
  return new URL(pathname, requestOrigin).toString();
}
