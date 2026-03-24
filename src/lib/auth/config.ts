function normalizeBaseUrl(value: string) {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

export function getPublicAuthBaseUrl() {
  const value = process.env.NEXT_PUBLIC_AUTH_BASE_URL?.trim();

  if (!value) {
    throw new Error(
      "NEXT_PUBLIC_AUTH_BASE_URL is missing in environment variables.",
    );
  }

  return normalizeBaseUrl(value);
}
