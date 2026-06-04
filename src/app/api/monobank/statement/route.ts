import { createProxyRoute } from "@/lib/server/proxy-route";

export const GET = createProxyRoute({
  auth: "admin",
  method: "GET",
  path: "/api/monobank/statement",
  search: "incoming",
  errorMessage: "Failed to load statement",
});
