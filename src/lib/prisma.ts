import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

// Disable strict TLS certificate verification for Supabase self-signed cert chain
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const globalForPrisma = global as unknown as { prisma: PrismaClient | null };

function createPrismaClient(): PrismaClient | null {
  const rawUrl = process.env.DATABASE_URL;
  if (!rawUrl) {
    return null;
  }

  try {
    // Strip conflicting sslmode parameters so pg pool uses explicit ssl settings
    const cleanUrl = rawUrl.replace(/[\?&]sslmode=[^&]+/g, "");
    const pool = new Pool({
      connectionString: cleanUrl,
      ssl: { rejectUnauthorized: false },
    });
    const adapter = new PrismaPg(pool);
    return new PrismaClient({ adapter });
  } catch (error) {
    console.warn("Failed to create Prisma client adapter:", error);
    return null;
  }
}

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production" && prisma) {
  globalForPrisma.prisma = prisma;
}
