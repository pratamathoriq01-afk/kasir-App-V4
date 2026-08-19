import { supabase } from "../src/lib/supabase";

async function cleanupTestTransaction() {
  console.log("=== CLEANING UP TEST TRANSACTION FROM SUPABASE ===");
  const testId = "trx-test-1787150119891";
  
  await supabase.from("TransactionItem").delete().eq("transactionId", testId);
  const { data, error } = await supabase.from("Transaction").delete().eq("id", testId).select();

  if (error) {
    console.error("Error deleting test transaction:", error);
  } else {
    console.log("Test transaction successfully cleaned up:", data);
  }
}

cleanupTestTransaction();
