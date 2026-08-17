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

export function getPrisma(): PrismaClient | null {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }
  const client = createPrismaClient();
  if (client) {
    globalForPrisma.prisma = client;
  }
  return client;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const instance = getPrisma();
    if (!instance) return undefined;
    const value = (instance as any)[prop];
    return typeof value === "function" ? value.bind(instance) : value;
  },
});
