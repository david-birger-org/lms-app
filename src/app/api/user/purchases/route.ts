import { createProxyRoute } from "@/lib/server/proxy-route";
import { getDefaultUserPurchasesSearch } from "@/lib/server/user-purchases";

export const GET = createProxyRoute({
  auth: "user",
  method: "GET",
  path: "/api/user/purchases",
  search: getDefaultUserPurchasesSearch,
  errorMessage: "Failed to fetch purchases",
});
