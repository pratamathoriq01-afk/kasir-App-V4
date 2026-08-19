import { supabase } from "../src/lib/supabase";

async function inspectLiveMenuItems() {
  console.log("=== INSPECTING CURRENT MENU ITEMS IN SUPABASE ===");
  const { data, error } = await supabase
    .from("MenuItem")
    .select("*")
    .order("createdAt", { ascending: true });

  if (error) {
    console.error("Error fetching menu items:", error);
  } else {
    console.log(`Total menu items in Supabase: ${data?.length || 0}`);
    data?.forEach((m, idx) => {
      console.log(`[${idx + 1}] ID: ${m.id} | Name: "${m.name}" | Category: ${m.category} | Price: ${m.price} | Active: ${m.isActive}`);
    });
  }
}

inspectLiveMenuItems();
