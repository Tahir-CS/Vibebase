import { Pool } from "pg";

declare global {
  var vibebasePostgresPool: Pool | undefined;
}

export function getDatabase() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is required for persistent VibeBase mode.");
  }
  if (!global.vibebasePostgresPool) {
    global.vibebasePostgresPool = new Pool({ connectionString, max: 10, idleTimeoutMillis: 20_000 });
  }
  return global.vibebasePostgresPool;
}

export function hasPersistentDatabase() {
  return Boolean(process.env.DATABASE_URL);
}
