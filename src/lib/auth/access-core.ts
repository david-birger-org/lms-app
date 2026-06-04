import "server-only";

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { cache } from "react";

import {
  type AuthSessionRecord,
  type AuthUser,
  getAuth,
} from "@/lib/auth/better-auth";

export interface ResolvedSession {
  session: AuthSessionRecord;
  user: AuthUser;
}

function toResolvedSession(
  session: Awaited<ReturnType<ReturnType<typeof getAuth>["api"]["getSession"]>>,
): ResolvedSession | null {
  return session ? { session: session.session, user: session.user } : null;
}

// Resolves the current request session once per request (React cache); shared
// by the page-level admin and user guards.
export const resolveSession = cache(
  async (): Promise<ResolvedSession | null> => {
    return toResolvedSession(
      await getAuth().api.getSession({ headers: await headers() }),
    );
  },
);

// API-route variant: classifies the session off the request's own headers.
export async function resolveSessionFor(
  requestHeaders: Headers,
): Promise<ResolvedSession | null> {
  return toResolvedSession(
    await getAuth().api.getSession({ headers: requestHeaders }),
  );
}

export function unauthorizedApiResponse() {
  return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
}

export function forbiddenApiResponse() {
  return NextResponse.json({ error: "Forbidden." }, { status: 403 });
}

export function authErrorApiResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Unexpected error";
  return NextResponse.json(
    { error: `Failed to authorize request: ${message}` },
    { status: 500 },
  );
}
