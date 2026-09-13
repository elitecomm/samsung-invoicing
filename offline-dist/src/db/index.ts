import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;

// For offline version, don't throw if DATABASE_URL missing
const isOfflineBuild = process.env.NEXT_PUBLIC_OFFLINE_MODE === "true" || !databaseUrl || databaseUrl.includes("dummy");

let pool: Pool | null = null;
let db: any = null;

if (!isOfflineBuild && databaseUrl) {
  const globalForDb = globalThis as typeof globalThis & {
    __arenaNextJsPostgresqlPool?: Pool;
  };

  pool =
    globalForDb.__arenaNextJsPostgresqlPool ??
    new Pool({
      connectionString: databaseUrl,
    });

  if (process.env.NODE_ENV !== "production") {
    globalForDb.__arenaNextJsPostgresqlPool = pool;
  }

  db = drizzle(pool);
} else {
  // Offline mode - mock db that will be handled by offlineStore on client
  // Server-side will return empty, client will use localStorage
  console.log("⚠️  Running in OFFLINE MODE - Using localStorage for data");
  db = null;
  pool = null;
}

export { pool, db };
export const isOffline = isOfflineBuild;
