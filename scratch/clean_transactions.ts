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

  console.log("Cleaning up old test transactions in Supabase DB...");

  // Update existing COMPLETED/PROCESSED test transactions to NEW_ORDER if needed or leave clean test data
  const updateRes = await pool.query(
    `UPDATE "Transaction" SET "orderStatus" = 'NEW_ORDER' WHERE "customerName" ILIKE '%yanti%' OR "customerName" ILIKE '%test%';`
  );

  console.log(`Updated ${updateRes.rowCount} test transaction rows to NEW_ORDER!`);

  const res = await pool.query(
    `SELECT id, "orderNumber", "customerName", "orderType", "orderStatus", "createdAt" FROM "Transaction" ORDER BY "createdAt" DESC LIMIT 15;`
  );

  console.table(res.rows);
  await pool.end();
}

main().catch(console.error);
