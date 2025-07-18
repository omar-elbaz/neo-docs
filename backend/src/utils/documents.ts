import { PrismaClient } from "@prisma/client";

export const ensureDocumentOwnership = async (
  prisma: PrismaClient,
  documentId: string,
  userId: string
) => {
  const document = await prisma.document.findFirst({
    where: {
      id: documentId,
      authorId: userId,
    },
  });

  if (!document) {
    throw new Error("Document not found or access denied");
  }

  return document;
};

export const getDocumentsByUser = async (
  prisma: PrismaClient,
  userId: string
) => {
  return prisma.document.findMany({
    where: { authorId: userId },
    include: { author: true },
  });
};
