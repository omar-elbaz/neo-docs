import type { FastifyInstance } from "fastify";
import { getUserFromToken } from "../utils/auth.ts";
import { getPrismaClient } from "../utils/database.ts";
import { getActivityDescription } from "../types/activity.ts";

export const activityHandlers = async (fastify: FastifyInstance) => {
  const prisma = getPrismaClient();

  // Get activities for a document since a timestamp (for live history sidebar)
  fastify.get("/documents/:id/activities", async (req, reply) => {
    const user = await getUserFromToken(req);
    const { id: documentId } = req.params as { id: string };
    const { since } = req.query as { since?: string };

    try {
      // Check if user has access to this document
      const document = await prisma.documents.findFirst({
        where: {
          id: documentId,
          OR: [
            { authorId: user.id },
            { document_shares: { some: { userId: user.id } } },
            { isPublic: true },
          ],
        },
      });

      if (!document) {
        return reply.status(404).send({ message: "Document not found or access denied" });
      }

      // Parse since timestamp (default to session start - last 2 hours)
      const sinceDate = since 
        ? new Date(since) 
        : new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago

      // Fetch activities since the timestamp
      const activities = await prisma.document_activities.findMany({
        where: {
          documentId,
          timestamp: {
            gte: sinceDate,
          },
        },
        include: {
          // This won't work with current schema - we need to join with users table
          // For now we'll fetch user info separately
        },
        orderBy: {
          timestamp: 'desc',
        },
        take: 100, // Limit to last 100 activities
      });

      // Fetch user info for all activities
      const userIds = [...new Set(activities.map(a => a.userId))];
      const users = await prisma.users.findMany({
        where: { id: { in: userIds } },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      });

      const userMap = new Map(users.map(u => [u.id, u]));

      // Transform activities with user info and descriptions
      const enrichedActivities = activities.map(activity => {
        const user = userMap.get(activity.userId);
        const activityWithUser = {
          ...activity,
          user,
        };

        return {
          id: activity.id,
          documentId: activity.documentId,
          userId: activity.userId,
          type: activity.type,
          timestamp: activity.timestamp,
          description: getActivityDescription(activityWithUser as any),
          user: user ? {
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            email: user.email,
          } : null,
        };
      });

      return reply.send({
        activities: enrichedActivities,
        total: enrichedActivities.length,
        since: sinceDate.toISOString(),
      });

    } catch (error) {
      console.error('Failed to fetch document activities:', error);
      return reply.status(500).send({ message: "Failed to fetch activities" });
    }
  });

  // Get activity statistics for a document
  fastify.get("/documents/:id/activity-stats", async (req, reply) => {
    const user = await getUserFromToken(req);
    const { id: documentId } = req.params as { id: string };

    try {
      // Check document access
      const document = await prisma.documents.findFirst({
        where: {
          id: documentId,
          OR: [
            { authorId: user.id },
            { document_shares: { some: { userId: user.id } } },
            { isPublic: true },
          ],
        },
      });

      if (!document) {
        return reply.status(404).send({ message: "Document not found" });
      }

      // Get activity counts by type for today
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const stats = await prisma.document_activities.groupBy({
        by: ['type'],
        where: {
          documentId,
          timestamp: {
            gte: today,
          },
        },
        _count: {
          type: true,
        },
      });

      return reply.send({
        stats: stats.map(stat => ({
          type: stat.type,
          count: stat._count.type,
        })),
        date: today.toISOString(),
      });

    } catch (error) {
      console.error('Failed to fetch activity stats:', error);
      return reply.status(500).send({ message: "Failed to fetch activity statistics" });
    }
  });
};