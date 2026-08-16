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

  console.log("Fixing DB statuses in Supabase PostgreSQL DB...");

  // Update rows where orderStatus is PROCESSED or PENDING to NEW_ORDER
  const res = await pool.query(
    `UPDATE "Transaction" SET "orderStatus" = 'NEW_ORDER' WHERE "orderStatus" = 'PROCESSED' OR "orderStatus" = 'PENDING' OR "orderStatus" IS NULL;`
  );

  console.log(`Updated ${res.rowCount} transaction rows in Supabase DB to NEW_ORDER!`);

  const listRes = await pool.query(
    `SELECT id, "orderNumber", "customerName", "orderType", "orderStatus", "createdAt" FROM "Transaction" ORDER BY "createdAt" DESC LIMIT 10;`
  );

  console.table(listRes.rows);
  await pool.end();
}

main().catch(console.error);
