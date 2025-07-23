import { PrismaClient } from "@prisma/client";
import {
  consumer,
  DocumentEvent,
  DocumentOperation,
  TOPICS,
} from "./services/kafka.ts";

const prisma = new PrismaClient();

class DocumentWorker {
  async start() {
    console.log("Starting document worker...");

    try {
      // Connect to Kafka
      await consumer.connect();
      console.log("Kafka consumer connected");

      // Subscribe to topics
      await consumer.subscribe({
        topics: [TOPICS.DOCUMENT_OPERATIONS, TOPICS.DOCUMENT_EVENTS],
      });

      // Start consuming messages
      await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          try {
            const value = message.value?.toString();
            if (!value) return;

            console.log(`Processing message from ${topic}:${partition}`);

            if (topic === TOPICS.DOCUMENT_OPERATIONS) {
              await this.handleDocumentOperation(JSON.parse(value));
            } else if (topic === TOPICS.DOCUMENT_EVENTS) {
              await this.handleDocumentEvent(JSON.parse(value));
            }
          } catch (error) {
            console.error("Error processing message:", error);
          }
        },
      });
    } catch (error) {
      console.error("Worker startup failed:", error);
      process.exit(1);
    }
  }

  private async handleDocumentOperation(operation: DocumentOperation) {
    const {
      type,
      documentId,
      userId,
      content,
      operation: proseMirrorOp,
      version,
      timestamp,
      activities,
    } = operation;

    console.log(
      `Processing ${type} operation for document ${documentId} by user ${userId}`
    );

    try {
      switch (type) {
        case "CREATE":
          await this.createDocument(
            documentId,
            userId,
            content || {},
            timestamp
          );
          break;

        case "UPDATE":
          await this.updateDocument(
            documentId,
            userId,
            proseMirrorOp,
            version,
            timestamp,
            content
          );
          break;

        case "DELETE":
          await this.deleteDocument(documentId, userId, timestamp);
          break;
      }
      // Store detailed activities from the operation
      if (activities && activities.length > 0) {
        for (const activity of activities) {
          try {
            await prisma.document_activities.create({
              data: {
                id: `${documentId}-${timestamp}-${Math.random()
                  .toString(36)
                  .substring(2, 11)}`,
                documentId,
                userId,
                type: activity.type,
                timestamp: new Date(timestamp),
                // Store metadata as JSON string since we don't have a metadata field
                // This could be enhanced with a proper metadata JSON field
              },
            });
          } catch (activityError) {
            console.error("Failed to store activity:", activityError);
          }
        }
      }
    } catch (error) {
      console.error(`Failed to process ${type} operation:`, error);
    }
  }

  private async handleDocumentEvent(event: DocumentEvent) {
    const { type, documentId, userId, timestamp } = event;

    console.log(
      `Processing ${type} event for document ${documentId} by user ${userId}`
    );

    try {
      if (type === "TITLE_UPDATE") {
        // Handle title updates specifically
        const title = (event as any).title;
        if (title) {
          await prisma.documents.update({
            where: { id: documentId },
            data: {
              title,
              lastEditedBy: userId,
              updatedAt: new Date(timestamp),
            },
          });
          console.log(`Updated document title for ${documentId}: "${title}"`);
        }
      }

      // Log user activity for analytics/audit
      await prisma.document_activities.create({
        data: {
          id: crypto.randomUUID(),
          documentId,
          userId,
          type: type.toLowerCase(),
          timestamp: new Date(timestamp),
        },
      });
    } catch (error) {
      console.error(`Failed to log document event:`, error);
    }
  }

  private async createDocument(
    documentId: string,
    userId: string,
    content: any,
    timestamp: number
  ) {
    // Check if document already exists
    const existing = await prisma.documents.findUnique({
      where: { id: documentId },
    });

    if (!existing) {
      await prisma.documents.create({
        data: {
          id: documentId,
          title: "Untitled Document",
          content,
          authorId: userId,
          lastEditedBy: userId,
          version: 1,
          revisionId: crypto.randomUUID(),
          createdAt: new Date(timestamp),
          updatedAt: new Date(timestamp),
        },
      });
      console.log(`Created document ${documentId}`);
    }
  }

  private async updateDocument(
    documentId: string,
    userId: string,
    operation: any,
    version: number,
    timestamp: number,
    kafkaContent?: any
  ) {
    // SIMPLIFIED APPROACH: Only use the authoritative content from WebSocket
    // No more operation replay - single source of truth

    if (!kafkaContent) {
      console.log(
        `No content provided in Kafka message for document ${documentId}, skipping update`
      );
      return;
    }

    // console.log(`💾 Saving content to database for document ${documentId}:`, {
    //   contentType: typeof kafkaContent,
    //   content: kafkaContent,
    //   version
    // });

    // Update document with the authoritative content from WebSocket
    const updated = await prisma.documents.update({
      where: { id: documentId },
      data: {
        content: kafkaContent as any,
        lastEditedBy: userId,
        version,
        updatedAt: new Date(timestamp),
      },
    });

    // console.log(`✅ Updated document ${documentId} to version ${version} with authoritative content from WebSocket`);

    // Optional: Still store operations for audit/analytics purposes (not for replay)
    try {
      await prisma.document_operations.create({
        data: {
          id: crypto.randomUUID(),
          documentId,
          userId,
          operation,
          version,
          revisionId: updated.revisionId,
          timestamp: new Date(timestamp),
        },
      });
    } catch (error) {
      console.error("Failed to store operation for audit:", error);
      // Don't fail the update if audit logging fails
    }
  }

  private async deleteDocument(
    documentId: string,
    userId: string,
    timestamp: number
  ) {
    await prisma.documents.update({
      where: { id: documentId },
      data: {
        deletedAt: new Date(timestamp),
        lastEditedBy: userId,
        updatedAt: new Date(timestamp),
      },
    });

    console.log(`Deleted document ${documentId}`);
  }

  async shutdown() {
    console.log("Shutting down worker...");
    await consumer.disconnect();
    await prisma.$disconnect();
  }

  // REMOVED: Complex operation reconstruction logic
  // We now use authoritative content snapshots from WebSocket instead of operation replay
}

// Start worker
const worker = new DocumentWorker();

// Graceful shutdown
process.on("SIGINT", async () => {
  await worker.shutdown();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await worker.shutdown();
  process.exit(0);
});

// Start the worker
worker.start().catch(console.error);
