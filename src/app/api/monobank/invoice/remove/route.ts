import { requireAdminApiAccess } from "@/lib/auth/admin-server";
import { proxyLmsSlsRequest } from "@/lib/server/lms-sls";

export async function POST(request: Request) {
  const access = await requireAdminApiAccess(request);

  if (!access.ok) {
    return access.response;
  }

  return proxyLmsSlsRequest({
    admin: access.admin,
    path: "/api/monobank/invoice/remove",
    request,
  });
}
