import { supabase } from "../src/lib/supabase";

async function checkLatestTransactions() {
  console.log("=== CHECKING LATEST TRANSACTIONS IN SUPABASE ===");
  try {
    const { data: trxs, error } = await supabase
      .from("Transaction")
      .select("*, items:TransactionItem(*)")
      .order("createdAt", { ascending: false })
      .limit(10);

    if (error) {
      console.error("Error querying transactions from Supabase:", error);
    } else {
      console.log(`Found ${trxs?.length || 0} transactions:`);
      trxs?.forEach((t, idx) => {
        console.log(`[${idx + 1}] ID: ${t.id} | Order#: ${t.orderNumber} | Customer: ${t.customerName} | Status: ${t.orderStatus} | Total: ${t.total} | Notes: ${t.orderNotes} | CreatedAt: ${t.createdAt}`);
      });
    }
  } catch (err) {
    console.error("Unexpected error:", err);
  }
}

checkLatestTransactions();
