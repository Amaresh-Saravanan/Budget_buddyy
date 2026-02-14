import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

const databaseUrl = process.env.DATABASE_URL;

export const isDatabaseConfigured = Boolean(databaseUrl);

export const pool = isDatabaseConfigured
  ? new Pool({ connectionString: databaseUrl })
  : null;

export const db = pool ? drizzle(pool, { schema }) : null;
