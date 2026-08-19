import { prisma } from "../src/lib/prisma";
import dotenv from "dotenv";
dotenv.config();

async function main() {
  const tables: any = await prisma.$queryRaw`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
    ORDER BY table_name;
  `;
  console.log("All tables in public schema:", tables);

  const menuRows: any = await prisma.$queryRaw`
    SELECT * FROM "MenuItem";
  `;
  console.log(`Rows in "MenuItem" via raw SQL: ${menuRows.length}`);
  console.log(menuRows);
}

main().catch(console.error);
