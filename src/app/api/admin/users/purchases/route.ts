import { NextResponse } from "next/server";

import { requireAdminApiAccess } from "@/lib/auth/admin-server";
import type { AuthenticatedUser } from "@/lib/auth/auth-server";
import { getAdminUserById } from "@/lib/server/admin-users";
import {
  forwardLmsSlsRequest,
  getForwardedSessionHeaders,
  mergeHeaders,
} from "@/lib/server/lms-sls";
import { createTrustedUserHeaders } from "@/lib/server/lms-sls-user";

export async function GET(request: Request) {
  const access = await requireAdminApiAccess(request);
  if (!access.ok) return access.response;

  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId")?.trim();

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required." },
        { status: 400 },
      );
    }

    const user = await getAdminUserById(userId);

    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const targetUser: AuthenticatedUser = {
      email: user.email,
      name: user.name,
      role: user.role,
      userId: user.id,
    };

    return await forwardLmsSlsRequest({
      headers: mergeHeaders(
        createTrustedUserHeaders(targetUser),
        getForwardedSessionHeaders(request.headers),
      ),
      method: "GET",
      path: "/api/user/purchases",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json(
      { error: `Failed to load user purchases: ${message}` },
      { status: 500 },
    );
  }
}
