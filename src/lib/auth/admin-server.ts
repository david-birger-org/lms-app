import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";

import { getServerAuthBaseUrl } from "@/lib/auth/config";
import { getForwardedAuthHeaders } from "@/lib/server/lms-sls";

type AuthSession = {
  session: {
    id: string;
    userId: string;
    [key: string]: unknown;
  };
  user: {
    email: string;
    id: string;
    name: string;
    role?: string | null;
    [key: string]: unknown;
  };
};

type AuthUser = AuthSession["user"];

type ResolvedAdminAccess =
  | {
      role: "admin";
      session: AuthSession["session"];
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

async function resolveAdminAccess(): Promise<ResolvedAdminAccess> {
  const response = await fetch(
    `${getServerAuthBaseUrl()}/api/auth/admin-session`,
    {
      cache: "no-store",
      headers: getForwardedAuthHeaders(await headers()),
    },
  );

  if (response.status === 401) {
    return { status: "unauthorized" };
  }

  if (response.status === 403) {
    return { status: "forbidden" };
  }

  if (!response.ok) {
    throw new Error(`Failed to resolve admin session: ${response.status}`);
  }

  const session = (await response.json()) as {
    role: "admin";
    session: AuthSession["session"];
    user: AuthUser;
  };

  return {
    role: session.role,
    session: session.session,
    status: "ok",
    userId: session.user.id,
    user: session.user,
  };
}

export async function requireAdminPageAccess(): Promise<ResolvedAdminSuccess> {
  const access = await resolveAdminAccess();

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
      ok: true;
      role: "admin";
      session: AuthSession["session"];
      userId: string;
      user: AuthUser;
    }
  | {
      ok: false;
      response: NextResponse;
    };

export async function requireAdminApiAccess(): Promise<AdminApiAccess> {
  const access = await resolveAdminAccess();

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
    ok: true,
    role: "admin",
    session: access.session,
    userId: access.userId,
    user: access.user,
  };
}
