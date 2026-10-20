export const accents = ["neutral", "blue", "violet", "green", "amber"] as const;

export type Accent = (typeof accents)[number];

export const ACCENT_COOKIE = "accent";

export function parseAccent(value: string | undefined): Accent {
  return accents.includes(value as Accent) ? (value as Accent) : "neutral";
}
