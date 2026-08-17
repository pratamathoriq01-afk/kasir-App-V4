import "dotenv/config";
import { getPrisma } from "../src/lib/prisma";

async function main() {
  console.log("Checking and upserting StoreSettings in Supabase PostgreSQL DB...");

  const prisma = getPrisma();
  if (!prisma) {
    throw new Error("Could not initialize Prisma client. Check DATABASE_URL in .env.");
  }

  // 1. Create table if not exists
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "StoreSettings" (
      "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
      "storeName" TEXT NOT NULL DEFAULT 'Kedai Nyamleng',
      "address" TEXT NOT NULL,
      "whatsapp" TEXT NOT NULL,
      "city" TEXT NOT NULL DEFAULT 'Kota Malang',
      "province" TEXT NOT NULL DEFAULT 'Jawa Timur',
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log("Table StoreSettings verified/created successfully.");

  // 2. Upsert store information
  const address = "Jl. Laksada Adi Sucipto Gg.14 No 42, Kelurahan Blimbing, Kecamatan Blimbing, Kota Malang, Jawa Timur";
  const whatsapp = "085113661387";

  await prisma.$executeRawUnsafe(`
    INSERT INTO "StoreSettings" ("id", "storeName", "address", "whatsapp", "city", "province", "updatedAt")
    VALUES ('default', 'Kedai Nyamleng', '${address}', '${whatsapp}', 'Kota Malang', 'Jawa Timur', NOW())
    ON CONFLICT ("id") DO UPDATE SET
      "address" = EXCLUDED."address",
      "whatsapp" = EXCLUDED."whatsapp",
      "updatedAt" = NOW();
  `);

  console.log("StoreSettings successfully upserted into Supabase DB!");

  const result: any[] = await prisma.$queryRawUnsafe(`SELECT * FROM "StoreSettings";`);
  console.log("Current DB StoreSettings:", JSON.stringify(result, null, 2));
}

main()
  .catch((e) => {
    console.error("Error upserting StoreSettings:", e);
    process.exit(1);
  });
