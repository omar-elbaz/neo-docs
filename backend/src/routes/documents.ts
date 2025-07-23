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
  type CreateDocumentRequest,
} from "../schema/index.ts";
import { getUserFromToken } from "../utils/auth.ts";
import { getPrismaClient } from "../utils/database.ts";
import { ensureDocumentOwnership } from "../utils/documents.ts";
import { storageService } from "../services/storage.ts";

export const documentHandlers = async (fastify: FastifyInstance) => {
  const prisma = getPrismaClient();

  // Create document
  fastify.post("/documents", async (req, reply) => {
    const user = await getUserFromToken(req);
    const body = CreateDocumentSchema.parse(req.body) as CreateDocumentRequest;

    const documentId = crypto.randomUUID();
    
    // Store content using hybrid storage service
    const storageResult = await storageService.storeDocument(
      documentId,
      body.content || {},
      1 // initial version
    );

    const document = await prisma.documents.create({
      data: {
        id: documentId,
        title: body.title,
        content: storageResult.content,
        filePath: storageResult.filePath,
        authorId: user.id,
        updatedAt: new Date(),
        revisionId: crypto.randomUUID(),
      },
      include: {
        users_documents_authorIdTousers: { select: { id: true, email: true } },
      },
    });

    console.log(`Document created: ${document.id} by user ${user.id}`);
    return reply.send(document);
  });

  // Get user's documents
  fastify.get("/documents", async (req, reply) => {
    const user = await getUserFromToken(req);

    const documents = await prisma.documents.findMany({
      where: {
        OR: [
          { authorId: user.id },
          { document_shares: { some: { userId: user.id } } },
        ],
        isArchived: false,
        deletedAt: null, // Exclude soft-deleted documents
      },
      include: {
        users_documents_authorIdTousers: { select: { id: true, email: true } },
        document_shares: {
          include: {
            users: { select: { id: true, email: true } },
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

    const document = await prisma.documents.findFirst({
      where: {
        id,
        deletedAt: null, // Exclude soft-deleted documents
        OR: [
          { authorId: user.id },
          { document_shares: { some: { userId: user.id } } },
          { isPublic: true },
        ],
      },
      include: {
        users_documents_authorIdTousers: { select: { id: true, email: true } },
        users_documents_lastEditedByTousers: {
          select: { id: true, email: true },
        },
        document_shares: {
          include: {
            users: { select: { id: true, email: true } },
          },
        },
      },
    });

    if (!document) {
      return reply.status(404).send({ message: "Document not found" });
    }

    // Retrieve content using hybrid storage service
    try {
      const content = await storageService.retrieveDocument(document.content, document.filePath);
      
      // Return document with resolved content
      return reply.send({
        ...document,
        content,
      });
    } catch (error) {
      console.error(`Failed to retrieve document content for ${id}:`, error);
      return reply.status(500).send({ message: "Failed to retrieve document content" });
    }
  });

  // Update document - DISABLED for event-driven architecture
  // All document updates should go through WebSocket → Kafka → Worker
  fastify.put("/documents/:id", async (req, reply) => {
    return reply.status(405).send({
      message:
        "Direct document updates are disabled. Use WebSocket for real-time collaboration.",
    });
  });

  // Delete document (soft delete)
  fastify.delete("/documents/:id", async (req, reply) => {
    const user = await getUserFromToken(req);
    const { id } = req.params as { id: string };

    await ensureDocumentOwnership(prisma, id, user.id);

    // Get document first to access filePath
    const document = await prisma.documents.findUnique({
      where: { id },
      select: { filePath: true },
    });

    // Soft delete: set deletedAt timestamp instead of removing from database
    await prisma.documents.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Delete from S3 if filePath exists
    if (document?.filePath) {
      await storageService.deleteDocument(document.filePath);
    }

    console.log(`Document soft deleted: ${id} by user ${user.id} (storage: ${storageService.getStorageMode()})`);
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

    const targetUser = await prisma.users.findUnique({
      where: { email },
    });

    if (!targetUser) {
      return reply.status(404).send({ message: "User not found" });
    }

    const share = await prisma.document_shares.upsert({
      where: {
        documentId_userId: {
          documentId: id,
          userId: targetUser.id,
        },
      },
      update: { permission },
      create: {
        id: crypto.randomUUID(),
        documentId: id,
        userId: targetUser.id,
        permission,
      },
      include: {
        users: { select: { id: true, email: true } },
      },
    });

    console.log(`Document shared: ${id} with ${email} (${permission})`);
    return reply.send(share);
  });
};
