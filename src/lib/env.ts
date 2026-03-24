import "server-only";

function readEnv(name: string) {
  const value = process.env[name]?.trim();
  return value ? value : null;
}

function getRequiredEnv(name: string) {
  const value = readEnv(name);

  if (!value) {
    throw new Error(`${name} is missing in environment variables.`);
  }

  return value;
}

export const env = {
  get betterAuthSecret() {
    return getRequiredEnv("BETTER_AUTH_SECRET");
  },
  get betterAuthTrustedOrigins() {
    return readEnv("BETTER_AUTH_TRUSTED_ORIGINS");
  },
  get betterAuthUrl() {
    return getRequiredEnv("BETTER_AUTH_URL");
  },
  get databaseUrl() {
    return getRequiredEnv("DATABASE_URL");
  },
  get lmsSlsApiKey() {
    return getRequiredEnv("LMS_SLS_API_KEY");
  },
  get lmsSlsBaseUrl() {
    return getRequiredEnv("LMS_SLS_BASE_URL");
  },
};
