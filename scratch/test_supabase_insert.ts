import { supabase } from "../src/lib/supabase";
import { INITIAL_MENU_ITEMS } from "../src/lib/mock-data";
import dotenv from "dotenv";
dotenv.config();

async function main() {
  console.log("Inserting menu items via Supabase REST API...");
  for (const item of INITIAL_MENU_ITEMS) {
    const { data, error } = await supabase.from("MenuItem").upsert({
      id: item.id,
      name: item.name,
      category: item.category,
      price: item.price,
      hpp: item.hpp,
      taxPercent: item.taxPercent,
      icon: item.icon,
      isActive: item.isActive ?? true,
      updatedAt: new Date().toISOString(),
    }, { onConflict: "id" }).select();

    if (error) {
      console.error(`Error inserting ${item.name}:`, error);
    } else {
      console.log(`- Inserted ${item.name}:`, data);
    }
  }

  const { data: allItems, error: selectErr } = await supabase.from("MenuItem").select("*");
  if (selectErr) {
    console.error("Select error:", selectErr);
  } else {
    console.log(`\n🎉 Total Menu Items in Supabase Table: ${allItems?.length}`);
  }
}

main().catch(console.error);
