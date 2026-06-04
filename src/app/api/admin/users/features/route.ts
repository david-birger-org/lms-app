import { createProxyRoute } from "@/lib/server/proxy-route";

export const POST = createProxyRoute({
  auth: "admin",
  method: "POST",
  path: "/api/internal/app-users/upsert",
  forwardBody: true,
  errorMessage: "Failed to update feature",
});
