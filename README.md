# LMS Admin

Standalone app extracted from the public site workspace. It owns Better Auth locally on `app.davidbirger.com` and proxies Monobank payment tooling to `lms-sls` as a backend service.

## Setup

1. Install dependencies:

```bash
bun install
```

1. Copy the environment template and fill in the values:

```bash
cp .env.example .env.local
```

1. Start the development server:

```bash
bun run dev
```

The app runs on `http://localhost:3000` by default.

## Required Environment Variables

- `BETTER_AUTH_URL`
- `NEXT_PUBLIC_AUTH_BASE_URL` (browser Better Auth base URL)
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_API_KEY` (required for Better Auth Dash connectivity)
- `DATABASE_URL` (Neon pooled Postgres connection string for runtime; use the direct Neon URL only for migrations/admin work)
- `ADMIN_EMAILS` (optional comma-separated allowlist for auto-admin role assignment)
- `LMS_SLS_BASE_URL`
- `LMS_SLS_API_KEY`
- `WNBF_CHECKOUT_SECRET` (shared HMAC secret for WordPress external checkout links)

## Available Scripts

- `bun run dev`
- `bun run build`
- `bun run start`
- `bun run lint`
- `bun run format`
