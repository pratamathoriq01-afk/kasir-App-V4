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

  const countRes = await pool.query(`SELECT COUNT(*) FROM "Transaction"`);
  console.log("Total Transaction count in DB:", countRes.rows[0].count);

  const res = await pool.query(
    `SELECT t.id, t."orderNumber", t."customerName", t."customerEmail", t."customerPhone", t."orderType", t."orderStatus", t.total, t."createdAt"
     FROM "Transaction" t
     ORDER BY t."createdAt" DESC LIMIT 30;`
  );

  console.log("Latest 30 transactions:");
  console.table(res.rows);

  await pool.end();
}

main().catch(console.error);
