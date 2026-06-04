import "server-only";

import { redirect } from "next/navigation";
import type { NextResponse } from "next/server";

import {
  authErrorApiResponse,
  type ResolvedSession,
  resolveSession,
  resolveSessionFor,
  unauthorizedApiResponse,
} from "@/lib/auth/access-core";
import { isAdminUser } from "@/lib/auth/admin";
import type { AuthSessionRecord, AuthUser } from "@/lib/auth/better-auth";

export type UserRole = "admin" | "user";

export interface AuthenticatedUser {
  email: string | null;
  name: string | null;
  role: UserRole;
  userId: string;
}

interface AuthSuccess {
  authenticatedUser: AuthenticatedUser;
  role: UserRole;
  session: AuthSessionRecord;
  userId: string;
  user: AuthUser;
}

function resolveRole(user: AuthUser): UserRole {
  return isAdminUser(user) ? "admin" : "user";
}

function toAuthSuccess({ session, user }: ResolvedSession): AuthSuccess {
  const role = resolveRole(user);
  return {
    authenticatedUser: {
      email: user.email ?? null,
      name: user.name ?? null,
      role,
      userId: user.id,
    },
    role,
    session,
    userId: user.id,
    user,
  };
}

export async function requireAuthPageAccess(): Promise<AuthSuccess> {
  const resolved = await resolveSession();
  if (!resolved) redirect("/sign-in");
  return toAuthSuccess(resolved);
}

type AuthApiAccess =
  | (AuthSuccess & { ok: true })
  | { ok: false; response: NextResponse };

export async function requireAuthApiAccess(
  request: Request,
): Promise<AuthApiAccess> {
  let resolved: ResolvedSession | null;
  try {
    resolved = await resolveSessionFor(request.headers);
  } catch (error) {
    return { ok: false, response: authErrorApiResponse(error) };
  }

  if (!resolved) return { ok: false, response: unauthorizedApiResponse() };

  return { ok: true, ...toAuthSuccess(resolved) };
}
