// // Operations
// - `GET /documents` - List user's documents
// - `POST /documents` - Create new document
// - `GET /documents/:id` - Get document by ID
// - `PUT /documents/:id` - Update document
// - `DELETE /documents/:id` - Delete document
// - `POST /documents/:id/invite` - Invite collaborator
// backend/src/routes/documents.ts
import type { FastifyInstance } from "fastify";
import {
  CreateDocumentSchema,
  UpdateDocumentSchema,
  type CreateDocumentRequest,
  type UpdateDocumentRequest,
} from "../schema/index.ts";
import { getUserFromToken } from "../utils/auth.ts";
import { getPrismaClient } from "../utils/database.ts";
import { ensureDocumentOwnership } from "../utils/documents.ts";

export const documentHandlers = async (fastify: FastifyInstance) => {
  const prisma = getPrismaClient();

  // Create document
  fastify.post("/documents", async (req, reply) => {
    const user = await getUserFromToken(req);
    const body = CreateDocumentSchema.parse(req.body) as CreateDocumentRequest;

    const document = await prisma.document.create({
      data: {
        title: body.title,
        content: body.content || null,
        authorId: user.id,
      },
      include: {
        author: { select: { id: true, email: true } },
      },
    });

    console.log(`Document created: ${document.id} by user ${user.id}`);
    return reply.send(document);
  });

  // Get user's documents
  fastify.get("/documents", async (req, reply) => {
    const user = await getUserFromToken(req);

    const documents = await prisma.document.findMany({
      where: {
        OR: [{ authorId: user.id }, { shares: { some: { userId: user.id } } }],
        isArchived: false,
      },
      include: {
        author: { select: { id: true, email: true } },
        shares: {
          include: {
            user: { select: { id: true, email: true } },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return reply.send(documents);
  });

  // Get single document
  fastify.get("/documents/:id", async (req, reply) => {
    const user = await getUserFromToken(req);
    const { id } = req.params as { id: string };

    const document = await prisma.document.findFirst({
      where: {
        id,
        OR: [
          { authorId: user.id },
          { shares: { some: { userId: user.id } } },
          { isPublic: true },
        ],
      },
      include: {
        author: { select: { id: true, email: true } },
        lastEditor: { select: { id: true, email: true } },
        shares: {
          include: {
            user: { select: { id: true, email: true } },
          },
        },
      },
    });

    if (!document) {
      return reply.status(404).send({ message: "Document not found" });
    }

    return reply.send(document);
  });

  // Update document - DISABLED for event-driven architecture  
  // All document updates should go through WebSocket → Kafka → Worker
  fastify.put("/documents/:id", async (req, reply) => {
    return reply.status(405).send({ 
      message: "Direct document updates are disabled. Use WebSocket for real-time collaboration." 
    });
  });

  // Delete document
  fastify.delete("/documents/:id", async (req, reply) => {
    const user = await getUserFromToken(req);
    const { id } = req.params as { id: string };

    await ensureDocumentOwnership(prisma, id, user.id);

    await prisma.document.delete({
      where: { id },
    });

    console.log(`Document deleted: ${id} by user ${user.id}`);
    return reply.send({ success: true });
  });

  // Share document
  fastify.post("/documents/:id/share", async (req, reply) => {
    const user = await getUserFromToken(req);
    const { id } = req.params as { id: string };
    const { email, permission } = req.body as {
      email: string;
      permission: "READ" | "WRITE" | "ADMIN";
    };

    await ensureDocumentOwnership(prisma, id, user.id);

    const targetUser = await prisma.user.findUnique({
      where: { email },
    });

    if (!targetUser) {
      return reply.status(404).send({ message: "User not found" });
    }

    const share = await prisma.documentShare.upsert({
      where: {
        documentId_userId: {
          documentId: id,
          userId: targetUser.id,
        },
      },
      update: { permission },
      create: {
        documentId: id,
        userId: targetUser.id,
        permission,
      },
      include: {
        user: { select: { id: true, email: true } },
      },
    });

    console.log(`Document shared: ${id} with ${email} (${permission})`);
    return reply.send(share);
  });
};
