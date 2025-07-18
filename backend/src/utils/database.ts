// backend/src/utils/database.ts
import { PrismaClient } from "@prisma/client";

let prisma: PrismaClient;

export const getPrismaClient = (): PrismaClient => {
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
};

export const closePrismaConnection = async () => {
  if (prisma) {
    await prisma.$disconnect();
  }
};
