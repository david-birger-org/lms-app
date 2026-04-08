import { NextResponse } from "next/server";

import { requireAuthApiAccess } from "@/lib/auth/auth-server";
import { getDefaultUserPurchasesSearch } from "@/lib/server/user-purchases";
import {
  forwardLmsSlsRequest,
  getForwardedSessionHeaders,
  mergeHeaders,
} from "@/lib/server/lms-sls";
import { createTrustedUserHeaders } from "@/lib/server/lms-sls-user";

export async function GET(request: Request) {
  try {
    const access = await requireAuthApiAccess(request);
    if (!access.ok) return access.response;

    return await forwardLmsSlsRequest({
      headers: mergeHeaders(
        createTrustedUserHeaders(access.authenticatedUser),
        getForwardedSessionHeaders(request.headers),
      ),
      method: "GET",
      path: "/api/user/purchases",
      search: getDefaultUserPurchasesSearch(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json(
      { error: `Failed to fetch purchases: ${message}` },
      { status: 500 },
    );
  }
}
