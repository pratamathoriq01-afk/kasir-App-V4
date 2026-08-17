import dotenv from "dotenv";
dotenv.config();
import { Pool } from "pg";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

async function main() {
  const url = process.env.DIRECT_URL || process.env.DATABASE_URL;
  console.log("Connecting to DB URL:", url ? url.replace(/:[^:@]+@/, ":***@") : "NONE");

  const pool = new Pool({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
  });

  console.log("Resetting online order statuses so they populate 1. Pesanan Baru in Kasir App...");

  const res = await pool.query(
    `UPDATE "Transaction"
     SET "orderStatus" = 'NEW_ORDER', "orderNotes" = NULL
     WHERE "orderNumber" LIKE 'KDN-%' OR "customerEmail" IS NOT NULL OR "customerPhone" IS NOT NULL;`
  );

  console.log("Updated rows count:", res.rowCount);

  const check = await pool.query(
    `SELECT id, "orderNumber", "customerName", "customerEmail", "orderStatus", "createdAt"
     FROM "Transaction"
     ORDER BY "createdAt" DESC LIMIT 10;`
  );

  console.table(check.rows);
  await pool.end();
}

main().catch(console.error);
