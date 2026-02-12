import { Pool, type QueryResult, type QueryResultRow } from "pg";
import { serverEnv } from "@/server/config/env";

type GlobalPool = typeof globalThis & {
  __ssmsPool?: Pool;
};

const globalPool = globalThis as GlobalPool;

const pool =
  globalPool.__ssmsPool ??
  new Pool({
    connectionString: serverEnv.databaseUrl,
    max: 20,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  });

if (serverEnv.nodeEnv !== "production") {
  globalPool.__ssmsPool = pool;
}

export const dbPool = pool;

export const query = async <T extends QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<QueryResult<T>> => dbPool.query<T>(text, params);
