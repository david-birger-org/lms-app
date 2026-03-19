import "server-only";

import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";

import { isAdminSession, isAdminUser } from "@/lib/auth/admin";

type ClerkUser = Awaited<ReturnType<typeof currentUser>>;

type ResolvedAdminAccess =
  | {
      status: "ok";
      userId: string;
      user: ClerkUser | null;
    }
  | {
      status: "unauthorized";
    }
  | {
      status: "forbidden";
    };

type ResolvedAdminSuccess = Extract<ResolvedAdminAccess, { status: "ok" }>;

async function resolveAdminAccess(
  includeUser = false,
): Promise<ResolvedAdminAccess> {
  const { userId, sessionClaims } = await auth();

  if (!userId) {
    return { status: "unauthorized" };
  }

  if (isAdminSession(sessionClaims)) {
    return {
      status: "ok",
      userId,
      user: includeUser ? await currentUser() : null,
    };
  }

  const user = await currentUser();

  if (!isAdminUser(user)) {
    return { status: "forbidden" };
  }

  return {
    status: "ok",
    userId,
    user,
  };
}

export async function requireAdminPageAccess(
  options: { includeUser?: boolean } = {},
): Promise<ResolvedAdminSuccess> {
  const access = await resolveAdminAccess(options.includeUser);

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
      userId: string;
      user: ClerkUser | null;
    }
  | {
      ok: false;
      response: NextResponse;
    };

export async function requireAdminApiAccess(
  options: { includeUser?: boolean } = {},
): Promise<AdminApiAccess> {
  const access = await resolveAdminAccess(options.includeUser);

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
    userId: access.userId,
    user: access.user,
  };
}
