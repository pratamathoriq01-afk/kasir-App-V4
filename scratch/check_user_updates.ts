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

  console.log("Inspecting latest transactions and transaction items...");

  const res = await pool.query(
    `SELECT t.id, t."orderNumber", t."customerName", t."orderType", t."orderStatus", t.total, t."createdAt",
            i."nameSnapshot", i."priceSnapshot", i.qty
     FROM "Transaction" t
     LEFT JOIN "TransactionItem" i ON i."transactionId" = t.id
     ORDER BY t."createdAt" DESC LIMIT 15;`
  );

  console.table(res.rows);
  await pool.end();
}

main().catch(console.error);
