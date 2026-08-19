import { prisma } from "../src/lib/prisma";

async function enableRealtimeReplication() {
  console.log("=== ENABLING SUPABASE REALTIME REPLICATION FOR TRANSACTION TABLES ===");
  try {
    const p = prisma as any;
    
    // 1. Add Transaction and TransactionItem to supabase_realtime publication
    await p.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_publication_tables 
          WHERE pubname = 'supabase_realtime' AND tablename = 'Transaction'
        ) THEN
          ALTER PUBLICATION supabase_realtime ADD TABLE "Transaction";
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM pg_publication_tables 
          WHERE pubname = 'supabase_realtime' AND tablename = 'TransactionItem'
        ) THEN
          ALTER PUBLICATION supabase_realtime ADD TABLE "TransactionItem";
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM pg_publication_tables 
          WHERE pubname = 'supabase_realtime' AND tablename = 'MenuItem'
        ) THEN
          ALTER PUBLICATION supabase_realtime ADD TABLE "MenuItem";
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM pg_publication_tables 
          WHERE pubname = 'supabase_realtime' AND tablename = 'Voucher'
        ) THEN
          ALTER PUBLICATION supabase_realtime ADD TABLE "Voucher";
        END IF;
      END $$;
    `);

    console.log("✅ Successfully added Transaction, TransactionItem, MenuItem, and Voucher to supabase_realtime publication!");

    // 2. Verify publication tables
    const tables = await p.$queryRawUnsafe(`
      SELECT pubname, schemaname, tablename 
      FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime';
    `);

    console.log("Current Realtime Publication Tables:", tables);
  } catch (err) {
    console.error("Error configuring supabase realtime publication:", err);
  }
}

enableRealtimeReplication();
