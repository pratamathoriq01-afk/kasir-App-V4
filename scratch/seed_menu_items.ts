import { prisma } from "../src/lib/prisma";
import { INITIAL_MENU_ITEMS } from "../src/lib/mock-data";
import dotenv from "dotenv";
dotenv.config();

async function main() {
  console.log("Seeding menu items to Supabase DB...");
  for (const item of INITIAL_MENU_ITEMS) {
    const upserted = await prisma.menuItem.upsert({
      where: { id: item.id },
      update: {
        name: item.name,
        category: item.category,
        price: item.price,
        hpp: item.hpp,
        taxPercent: item.taxPercent,
        icon: item.icon,
        isActive: item.isActive,
      },
      create: {
        id: item.id,
        name: item.name,
        category: item.category,
        price: item.price,
        hpp: item.hpp,
        taxPercent: item.taxPercent,
        icon: item.icon,
        isActive: item.isActive ?? true,
      },
    });
    console.log(`- Seeded: ${upserted.name} (${upserted.category}) - Rp ${upserted.price}`);
  }
  const count = await prisma.menuItem.count();
  console.log(`\n✅ Success! Total menu items in live DB: ${count}`);
}

main()
  .catch((e) => console.error("Error seeding menu:", e))
  .finally(() => prisma.$disconnect());
