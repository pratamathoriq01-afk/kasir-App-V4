import { prisma } from "../src/lib/prisma";
import dotenv from "dotenv";
dotenv.config();

async function main() {
  const items = await prisma.menuItem.findMany({
    orderBy: { createdAt: "desc" },
  });
  console.log(`Total Menu Items in DB: ${items.length}`);
  console.log(JSON.stringify(items, null, 2));
}

main()
  .catch((e) => console.error("Error inspecting menu DB:", e))
  .finally(() => prisma.$disconnect());
