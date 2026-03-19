# LMS Admin

Standalone admin app extracted from the public site workspace. It owns the Clerk-protected back office and proxies Monobank payment tooling through `lms-sls`.

## Setup

1. Install dependencies:

```bash
bun install
```

2. Copy the environment template and fill in the values:

```bash
cp .env.example .env.local
```

3. Start the development server:

```bash
bun run dev
```

The app runs on `http://localhost:3000` by default.

## Required Environment Variables

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `LMS_SLS_BASE_URL`
- `LMS_SLS_API_KEY`

## Available Scripts

- `bun run dev`
- `bun run build`
- `bun run start`
- `bun run lint`
- `bun run format`
