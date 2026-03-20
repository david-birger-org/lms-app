import { createAuthClient } from "better-auth/react";

import { getPublicAuthBaseUrl } from "@/lib/auth/config";

export const authClient = createAuthClient({
  baseURL: getPublicAuthBaseUrl(),
  fetchOptions: {
    credentials: "include",
  },
});
