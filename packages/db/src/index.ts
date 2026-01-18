import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is required");
}

const client = postgres(connectionString, {
  connect_timeout: 30,
  idle_timeout: 20,
  max_lifetime: 60 * 30,
  backoff: (retries) => Math.min(2 ** retries, 30),
});
export const db = drizzle(client, { schema });

export * from "./schema";
export * from "./config";
