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

  console.log("Cleaning all transaction history in Supabase PostgreSQL DB...");

  // 1. Delete all items in TransactionItem table
  const deleteItems = await pool.query(`DELETE FROM "TransactionItem";`);
  console.log(`Deleted ${deleteItems.rowCount} rows from TransactionItem.`);

  // 2. Delete all transactions in Transaction table
  const deleteTrx = await pool.query(`DELETE FROM "Transaction";`);
  console.log(`Deleted ${deleteTrx.rowCount} rows from Transaction.`);

  // Verify DB count
  const count = await pool.query(`SELECT COUNT(*) FROM "Transaction";`);
  console.log(`Remaining transactions in Supabase DB: ${count.rows[0].count}`);

  await pool.end();
}

main().catch(console.error);
