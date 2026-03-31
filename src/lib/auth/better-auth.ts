import "server-only";

import { dash } from "@better-auth/infra";
import { betterAuth } from "better-auth";
import { Pool } from "pg";

import { isAdminEmail } from "@/lib/auth/admin";
import { env } from "@/lib/env";

declare global {
  var __lmsAdminAuth: AuthInstance | undefined;
  var __lmsAdminAuthPool: Pool | undefined;
}

function createAuth() {
  return betterAuth({
    advanced: {
      database: {
        generateId: () => crypto.randomUUID(),
      },
      useSecureCookies: process.env.NODE_ENV === "production",
    },
    appName: "LMS Admin",
    baseURL: normalizeBaseUrl(env.betterAuthUrl),
    database: getPool(),
    databaseHooks: {
      user: {
        create: {
          before: async (user) => ({
            data: {
              ...user,
              role: isAdminEmail(user.email) ? "admin" : "user",
            },
          }),
        },
        update: {
          before: async (user) => {
            if (typeof user.email !== "string") {
              return { data: user };
            }

            return {
              data: {
                ...user,
                role: isAdminEmail(user.email) ? "admin" : "user",
              },
            };
          },
        },
      },
    },
    emailAndPassword: {
      enabled: true,
    },
    plugins: [
      dash({
        apiKey: env.betterAuthApiKey,
      }),
    ],
    secret: env.betterAuthSecret,
    trustedOrigins: getTrustedOrigins(),
    account: {
      fields: {
        accessToken: "access_token",
        accessTokenExpiresAt: "access_token_expires_at",
        accountId: "account_id",
        createdAt: "created_at",
        idToken: "id_token",
        providerId: "provider_id",
        refreshToken: "refresh_token",
        refreshTokenExpiresAt: "refresh_token_expires_at",
        updatedAt: "updated_at",
        userId: "user_id",
      },
      modelName: "auth_accounts",
    },
    session: {
      cookieCache: {
        enabled: true,
        maxAge: 60,
        strategy: "jwe",
      },
      fields: {
        createdAt: "created_at",
        expiresAt: "expires_at",
        ipAddress: "ip_address",
        updatedAt: "updated_at",
        userAgent: "user_agent",
        userId: "user_id",
      },
      modelName: "auth_sessions",
    },
    user: {
      additionalFields: {
        role: {
          defaultValue: "user",
          input: false,
          required: false,
          type: ["user", "admin"],
        },
      },
      fields: {
        createdAt: "created_at",
        emailVerified: "email_verified",
        updatedAt: "updated_at",
      },
      modelName: "auth_users",
    },
    verification: {
      fields: {
        createdAt: "created_at",
        expiresAt: "expires_at",
        updatedAt: "updated_at",
      },
      modelName: "auth_verifications",
    },
  });
}

type AuthInstance = ReturnType<typeof createAuth>;

export type AuthSessionPayload = Exclude<
  Awaited<ReturnType<AuthInstance["api"]["getSession"]>>,
  null
>;
export type AuthSessionRecord = AuthSessionPayload["session"];
export type AuthUser = AuthSessionPayload["user"];

function readCsvEnv(value: string | null) {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function normalizeBaseUrl(value: string) {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

function shouldUseSsl(connectionString: string) {
  try {
    const url = new URL(connectionString);
    return !["127.0.0.1", "localhost"].includes(url.hostname);
  } catch {
    return false;
  }
}

function getTrustedOrigins() {
  return Array.from(
    new Set([
      normalizeBaseUrl(env.betterAuthUrl),
      "http://localhost:3000",
      ...readCsvEnv(env.betterAuthTrustedOrigins).map(normalizeBaseUrl),
    ]),
  );
}

function getAuthDatabaseUrl() {
  const connectionString = env.databaseUrl;

  try {
    const url = new URL(connectionString);

    if (url.hostname.endsWith(".pooler.supabase.com")) {
      if (url.port === "6543") {
        throw new Error(
          "DATABASE_URL must use the Supabase session pooler (port 5432) for Better Auth.",
        );
      }

      if (
        url.port === "5432" &&
        !decodeURIComponent(url.username).startsWith("postgres.")
      ) {
        throw new Error(
          "DATABASE_URL must use the pooled Supabase username (postgres.<project-ref>) with the session pooler.",
        );
      }
    }
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(
        "DATABASE_URL must be a valid Postgres connection string.",
      );
    }

    throw error;
  }

  return connectionString;
}

function getPool() {
  if (!globalThis.__lmsAdminAuthPool) {
    const connectionString = getAuthDatabaseUrl();

    globalThis.__lmsAdminAuthPool = new Pool({
      allowExitOnIdle: true,
      connectionTimeoutMillis: 10_000,
      connectionString,
      idleTimeoutMillis: 5_000,
      max: 1,
      maxUses: 1_000,
      ssl: shouldUseSsl(connectionString)
        ? { rejectUnauthorized: false }
        : undefined,
    });
  }

  return globalThis.__lmsAdminAuthPool;
}

export function getAuth() {
  if (!globalThis.__lmsAdminAuth) {
    globalThis.__lmsAdminAuth = createAuth();
  }

  return globalThis.__lmsAdminAuth;
}
