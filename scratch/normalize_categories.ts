import { supabase } from "../src/lib/supabase";

async function normalizeCategories() {
  console.log("=== NORMALIZING MENU CATEGORIES IN SUPABASE DB ===");

  await supabase
    .from("MenuItem")
    .update({ category: "Menu Ayam Nyamleng" })
    .in("name", ["Nyamleng PResto Daun Jeruk", "Nyamleng Presto Nasi Putih", "Nyamleng Presto Tanpa Nasi"]);

  await supabase
    .from("MenuItem")
    .update({ category: "Menu Minuman" })
    .in("name", ["ES Teh", "ES Jeruk"]);

  const { data } = await supabase.from("MenuItem").select("*");
  console.log("Updated Menu Items:", data?.map(d => ({ name: d.name, category: d.category })));
}

normalizeCategories();
