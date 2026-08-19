import { supabase } from "../src/lib/supabase";
import dotenv from "dotenv";
dotenv.config();

async function main() {
  const { data, error } = await supabase.from("MenuItem").select("*").order("createdAt", { ascending: true });
  if (error) {
    console.error("Supabase REST error:", error);
  } else {
    console.log(`✅ Supabase REST returned ${data?.length} items:`);
    console.log(JSON.stringify(data, null, 2));
  }
}

main().catch(console.error);
