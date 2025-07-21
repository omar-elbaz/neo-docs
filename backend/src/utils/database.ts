// backend/src/utils/database.ts
import { PrismaClient } from "@prisma/client";

let prisma: PrismaClient;

export const getPrismaClient = (): PrismaClient => {
  if (!prisma) {
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
      // Configure connection pooling
      log:
        process.env.NODE_ENV === "development"
          ? ["query", "error", "warn"]
          : ["error"],
    });
  }
  return prisma;
};

export const closePrismaConnection = async () => {
  if (prisma) {
    await prisma.$disconnect();
  }
};
