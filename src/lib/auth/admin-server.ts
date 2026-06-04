import "server-only";

import { redirect } from "next/navigation";
import type { NextResponse } from "next/server";

import {
  authErrorApiResponse,
  forbiddenApiResponse,
  type ResolvedSession,
  resolveSession,
  resolveSessionFor,
  unauthorizedApiResponse,
} from "@/lib/auth/access-core";
import { isAdminUser } from "@/lib/auth/admin";
import type { AuthSessionRecord, AuthUser } from "@/lib/auth/better-auth";

export interface AuthenticatedAdmin {
  email: string | null;
  name: string | null;
  role: "admin";
  userId: string;
}

interface AdminSuccess {
  admin: AuthenticatedAdmin;
  role: "admin";
  session: AuthSessionRecord;
  userId: string;
  user: AuthUser;
}

function toAdminSuccess({ session, user }: ResolvedSession): AdminSuccess {
  return {
    admin: {
      email: user.email ?? null,
      name: user.name ?? null,
      role: "admin",
      userId: user.id,
    },
    role: "admin",
    session,
    userId: user.id,
    user,
  };
}

export async function requireAdminPageAccess(): Promise<AdminSuccess> {
  const resolved = await resolveSession();
  if (!resolved) redirect("/sign-in");
  if (!isAdminUser(resolved.user)) redirect("/unauthorized");
  return toAdminSuccess(resolved);
}

type AdminApiAccess =
  | (AdminSuccess & { ok: true })
  | { ok: false; response: NextResponse };

export async function requireAdminApiAccess(
  request: Request,
): Promise<AdminApiAccess> {
  let resolved: ResolvedSession | null;
  try {
    resolved = await resolveSessionFor(request.headers);
  } catch (error) {
    return { ok: false, response: authErrorApiResponse(error) };
  }

  if (!resolved) return { ok: false, response: unauthorizedApiResponse() };
  if (!isAdminUser(resolved.user))
    return { ok: false, response: forbiddenApiResponse() };

  return { ok: true, ...toAdminSuccess(resolved) };
}
