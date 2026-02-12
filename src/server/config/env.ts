const DEFAULT_JWT_SECRET =
  "change-me-to-a-long-random-secret-value-for-local-dev-1234567890";

const toBoolean = (value: string | undefined, fallback: boolean): boolean => {
  if (!value) {
    return fallback;
  }
  return value.trim().toLowerCase() === "true";
};

const toNumber = (value: string | undefined, fallback: number): number => {
  if (!value) {
    return fallback;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const resolveDatabaseUrl = (): string => {
  const direct = process.env.DATABASE_URL;
  if (direct && direct.trim()) {
    return direct.trim();
  }

  const jdbc = process.env.DB_URL;
  if (jdbc && jdbc.startsWith("jdbc:postgresql://")) {
    const url = new URL(jdbc.replace(/^jdbc:/, ""));
    if (process.env.DB_USERNAME) {
      url.username = process.env.DB_USERNAME;
    }
    if (process.env.DB_PASSWORD) {
      url.password = process.env.DB_PASSWORD;
    }
    return url.toString();
  }

  return "postgresql://ssms:ssms@localhost:55432/ssms";
};

export const serverEnv = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  databaseUrl: resolveDatabaseUrl(),
  jwtSecret: process.env.JWT_SECRET ?? DEFAULT_JWT_SECRET,
  jwtAccessTtlSeconds: toNumber(process.env.JWT_ACCESS_TTL_SECONDS, 3600),
  jwtRefreshTtlSeconds: toNumber(process.env.JWT_REFRESH_TTL_SECONDS, 604800),
  secureCookie: toBoolean(process.env.SECURE_COOKIE, false),
};
