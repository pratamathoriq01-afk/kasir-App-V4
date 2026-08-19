import { Client } from "pg";
import dotenv from "dotenv";
dotenv.config();

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

async function enableRealtime() {
  console.log("=== ENABLING SUPABASE REALTIME REPLICATION VIA PG CLIENT ===");
  const rawUrl = process.env.DATABASE_URL || "";
  const cleanUrl = rawUrl.replace(/[\?&]sslmode=[^&]+/g, "");

  const client = new Client({
    connectionString: cleanUrl,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  console.log("Connected to Supabase PostgreSQL!");

  try {
    await client.query(`ALTER PUBLICATION supabase_realtime ADD TABLE "Transaction";`);
    console.log("Added Transaction to supabase_realtime");
  } catch (e: any) {
    console.log("Transaction table replication note:", e.message);
  }

  try {
    await client.query(`ALTER PUBLICATION supabase_realtime ADD TABLE "TransactionItem";`);
    console.log("Added TransactionItem to supabase_realtime");
  } catch (e: any) {
    console.log("TransactionItem table replication note:", e.message);
  }

  try {
    await client.query(`ALTER PUBLICATION supabase_realtime ADD TABLE "MenuItem";`);
    console.log("Added MenuItem to supabase_realtime");
  } catch (e: any) {
    console.log("MenuItem table replication note:", e.message);
  }

  try {
    await client.query(`ALTER PUBLICATION supabase_realtime ADD TABLE "Voucher";`);
    console.log("Added Voucher to supabase_realtime");
  } catch (e: any) {
    console.log("Voucher table replication note:", e.message);
  }

  const res = await client.query(`
    SELECT pubname, schemaname, tablename 
    FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime';
  `);

  console.log("Current Realtime Publication Tables in Supabase DB:", res.rows);

  await client.end();
}

enableRealtime();
