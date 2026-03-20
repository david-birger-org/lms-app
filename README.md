# LMS Admin

Standalone admin app extracted from the public site workspace. It consumes Better Auth from `lms-sls` and proxies Monobank payment tooling through the same backend.

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

- `AUTH_BASE_URL` (server-side Better Auth base URL, defaults to `LMS_SLS_BASE_URL`)
- `NEXT_PUBLIC_AUTH_BASE_URL` (browser Better Auth base URL)
- `LMS_SLS_BASE_URL`
- `LMS_SLS_API_KEY`

## Available Scripts

- `bun run dev`
- `bun run build`
- `bun run start`
- `bun run lint`
- `bun run format`
