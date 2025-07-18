// // Operations
// - `GET /documents` - List user's documents
// - `POST /documents` - Create new document
// - `GET /documents/:id` - Get document by ID
// - `PUT /documents/:id` - Update document
// - `DELETE /documents/:id` - Delete document
// - `POST /documents/:id/invite` - Invite collaborator
// backend/src/routes/documents.ts
import { FastifyInstance } from "fastify";
import {
  CreateDocumentSchema,
  UpdateDocumentSchema,
  type CreateDocumentRequest,
  type UpdateDocumentRequest,
} from "../schema";
import { getUserFromToken } from "../utils/auth";
import { getPrismaClient } from "../utils/database";
import {
  ensureDocumentOwnership,
  getDocumentsByUser,
} from "../utils/documents";

export const documentHandlers = async (fastify: FastifyInstance) => {
  const prisma = getPrismaClient();

  // Create document
  fastify.post("/documents", async (req) => {
    const user = await getUserFromToken(req);
    const body = CreateDocumentSchema.parse(req.body) as CreateDocumentRequest;

    const document = await prisma.document.create({
      data: {
        ...body,
        authorId: user.id,
      },
    });

    return document;
  });

  // Get user's documents
  fastify.get("/documents", async (req) => {
    const user = await getUserFromToken(req);
    return await getDocumentsByUser(prisma, user.id);
  });

  // Update document
  fastify.put("/documents/:id", async (req) => {
    const user = await getUserFromToken(req);
    const { id } = req.params as { id: string };
    const body = UpdateDocumentSchema.parse(req.body) as UpdateDocumentRequest;

    await ensureDocumentOwnership(prisma, id, user.id);

    const document = await prisma.document.update({
      where: { id },
      data: body,
    });

    return document;
  });

  // Delete document
  fastify.delete("/documents/:id", async (req) => {
    const user = await getUserFromToken(req);
    const { id } = req.params as { id: string };

    await ensureDocumentOwnership(prisma, id, user.id);

    await prisma.document.delete({
      where: { id },
    });

    return { success: true };
  });
};
