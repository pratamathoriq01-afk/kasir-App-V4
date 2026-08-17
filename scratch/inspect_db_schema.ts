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

  console.log("=== INSPECTING SUPABASE DB COLUMNS ===");

  const colRes = await pool.query(
    `SELECT column_name, data_type, column_default, is_nullable
     FROM information_schema.columns
     WHERE table_name = 'Transaction' AND column_name = 'orderStatus';`
  );
  console.log("Column orderStatus definition:", colRes.rows);

  const distinctRes = await pool.query(
    `SELECT DISTINCT "orderStatus" FROM "Transaction";`
  );
  console.log("Distinct orderStatus values in DB:", distinctRes.rows);

  await pool.end();
}

main().catch(console.error);
