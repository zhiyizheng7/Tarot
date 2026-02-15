import { loadEnvConfig } from "@next/env";
import { PrismaClient } from "@prisma/client";

// In some dev flows (Turbopack/App Route), Prisma may initialize before env is hydrated.
// Ensure .env.local/.env are loaded before PrismaClient is constructed.
if (!process.env.DATABASE_URL) {
  loadEnvConfig(process.cwd());
}

if (!process.env.DATABASE_URL) {
  throw new Error("Missing DATABASE_URL. Please set it in .env.local");
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
