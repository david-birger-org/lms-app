export interface RuntimeCheck {
  label: string;
  ready: boolean;
}

export function getRuntimeChecks(): RuntimeCheck[] {
  return [
    {
      label: "Better Auth URL",
      ready: Boolean(process.env.BETTER_AUTH_URL),
    },
    {
      label: "Public auth URL",
      ready: Boolean(process.env.NEXT_PUBLIC_AUTH_BASE_URL),
    },
    {
      label: "Better Auth secret",
      ready: Boolean(process.env.BETTER_AUTH_SECRET),
    },
    {
      label: "Auth database URL",
      ready: Boolean(process.env.DATABASE_URL),
    },
    {
      label: "LMS SLS base URL",
      ready: Boolean(process.env.LMS_SLS_BASE_URL),
    },
    {
      label: "LMS SLS API key",
      ready: Boolean(process.env.LMS_SLS_API_KEY),
    },
  ];
}
