export interface RuntimeCheck {
  label: string;
  ready: boolean;
}

export function getRuntimeChecks(): RuntimeCheck[] {
  return [
    {
      label: "Clerk publishable key",
      ready: Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY),
    },
    {
      label: "Clerk secret key",
      ready: Boolean(process.env.CLERK_SECRET_KEY),
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
