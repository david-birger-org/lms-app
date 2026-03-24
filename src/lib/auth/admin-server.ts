import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";

import { isAdminUser } from "@/lib/auth/admin";
import {
  type AuthSessionRecord,
  type AuthUser,
  getAuth,
} from "@/lib/auth/better-auth";

export interface AuthenticatedAdmin {
  email: string | null;
  name: string | null;
  role: "admin";
  userId: string;
}

type ResolvedAdminAccess =
  | {
      admin: AuthenticatedAdmin;
      role: "admin";
      session: AuthSessionRecord;
      status: "ok";
      userId: string;
      user: AuthUser;
    }
  | {
      status: "unauthorized";
    }
  | {
      status: "forbidden";
    };

type ResolvedAdminSuccess = Extract<ResolvedAdminAccess, { status: "ok" }>;

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unexpected error";
}

async function resolveAdminAccess(
  requestHeaders: Headers,
): Promise<ResolvedAdminAccess> {
  const session = await getAuth().api.getSession({
    headers: requestHeaders,
  });

  if (!session) {
    return { status: "unauthorized" };
  }

  if (!isAdminUser(session.user)) {
    return { status: "forbidden" };
  }

  return {
    admin: {
      email: session.user.email ?? null,
      name: session.user.name ?? null,
      role: "admin",
      userId: session.user.id,
    },
    role: "admin",
    session: session.session,
    status: "ok",
    userId: session.user.id,
    user: session.user,
  };
}

async function resolveCurrentAdminAccess() {
  return resolveAdminAccess(await headers());
}

export async function requireAdminPageAccess(): Promise<ResolvedAdminSuccess> {
  const access = await resolveCurrentAdminAccess();

  if (access.status === "unauthorized") {
    redirect("/sign-in");
  }

  if (access.status === "forbidden") {
    redirect("/unauthorized");
  }

  return access;
}

type AdminApiAccess =
  | {
      admin: AuthenticatedAdmin;
      ok: true;
      role: "admin";
      session: AuthSessionRecord;
      userId: string;
      user: AuthUser;
    }
  | {
      ok: false;
      response: NextResponse;
    };

export async function requireAdminApiAccess(
  request: Request,
): Promise<AdminApiAccess> {
  let access: ResolvedAdminAccess;

  try {
    access = await resolveAdminAccess(request.headers);
  } catch (error) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: `Failed to authorize request: ${getErrorMessage(error)}` },
        { status: 500 },
      ),
    };
  }

  if (access.status === "unauthorized") {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized." }, { status: 401 }),
    };
  }

  if (access.status === "forbidden") {
    return {
      ok: false,
      response: NextResponse.json({ error: "Forbidden." }, { status: 403 }),
    };
  }

  return {
    admin: access.admin,
    ok: true,
    role: "admin",
    session: access.session,
    userId: access.userId,
    user: access.user,
  };
}
