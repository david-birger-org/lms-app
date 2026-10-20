import { createProxyRoute } from "@/lib/server/proxy-route";

export const runtime = "nodejs";

const PATH = "/api/lectures/admin/notes";

export const PUT = createProxyRoute({
  auth: "admin",
  method: "PUT",
  path: PATH,
  rawBodyContentType: "application/pdf",
  search: "incoming",
  errorMessage: "Failed to upload lecture notes",
});

export const DELETE = createProxyRoute({
  auth: "admin",
  method: "DELETE",
  path: PATH,
  search: "incoming",
  errorMessage: "Failed to remove lecture notes",
});
