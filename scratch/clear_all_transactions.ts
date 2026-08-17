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

  console.log("Clearing all transactions and transaction items from Supabase DB...");

  const delItems = await pool.query(`DELETE FROM "TransactionItem";`);
  console.log("Deleted TransactionItems count:", delItems.rowCount);

  const delTrx = await pool.query(`DELETE FROM "Transaction";`);
  console.log("Deleted Transactions count:", delTrx.rowCount);

  const countRes = await pool.query(`SELECT COUNT(*) FROM "Transaction"`);
  console.log("Remaining Transaction count in DB:", countRes.rows[0].count);

  await pool.end();
}

main().catch(console.error);
