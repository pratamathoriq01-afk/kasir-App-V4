import dotenv from "dotenv";
dotenv.config();
import { Pool } from "pg";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

async function main() {
  const url = process.env.DIRECT_URL || process.env.DATABASE_URL;
  const pool = new Pool({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
  });

  const colDefault = await pool.query(
    `SELECT column_name, column_default FROM information_schema.columns WHERE table_name='Transaction' AND column_name='orderStatus';`
  );
  console.log("--- COLUMN DEFAULT IN SUPABASE POSTGRESQL ---");
  console.table(colDefault.rows);

  await pool.end();
}

main().catch(console.error);
