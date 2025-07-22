import { consumer, TOPICS, DocumentOperation, DocumentEvent } from './services/kafka.ts';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class DocumentWorker {
  async start() {
    console.log('Starting document worker...');
    
    try {
      // Connect to Kafka
      await consumer.connect();
      console.log('Kafka consumer connected');

      // Subscribe to topics
      await consumer.subscribe({ 
        topics: [TOPICS.DOCUMENT_OPERATIONS, TOPICS.DOCUMENT_EVENTS] 
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
            console.error('Error processing message:', error);
          }
        },
      });

    } catch (error) {
      console.error('Worker startup failed:', error);
      process.exit(1);
    }
  }

  private async handleDocumentOperation(operation: DocumentOperation) {
    const { type, documentId, userId, content, operation: proseMirrorOp, version, timestamp } = operation;

    console.log(`Processing ${type} operation for document ${documentId} by user ${userId}`);

    try {
      switch (type) {
        case 'CREATE':
          await this.createDocument(documentId, userId, content || {}, timestamp);
          break;
        
        case 'UPDATE':
          await this.updateDocument(documentId, userId, proseMirrorOp, version, timestamp, content);
          break;
        
        case 'DELETE':
          await this.deleteDocument(documentId, userId, timestamp);
          break;
      }
    } catch (error) {
      console.error(`Failed to process ${type} operation:`, error);
    }
  }

  private async handleDocumentEvent(event: DocumentEvent) {
    const { type, documentId, userId, timestamp } = event;

    console.log(`Processing ${type} event for document ${documentId} by user ${userId}`);

    try {
      // Log user activity for analytics/audit
      await prisma.document_activities.create({
        data: {
          documentId,
          userId,
          type: type.toLowerCase(),
          timestamp: new Date(timestamp)
        }
      });
    } catch (error) {
      console.error(`Failed to log document event:`, error);
    }
  }

  private async createDocument(documentId: string, userId: string, content: any, timestamp: number) {
    // Check if document already exists
    const existing = await prisma.documents.findUnique({ where: { id: documentId } });
    
    if (!existing) {
      await prisma.documents.create({
        data: {
          id: documentId,
          title: 'Untitled Document',
          content,
          authorId: userId,
          lastEditedBy: userId,
          version: 1,
          createdAt: new Date(timestamp),
          updatedAt: new Date(timestamp)
        }
      });
      console.log(`Created document ${documentId}`);
    }
  }

  private async updateDocument(documentId: string, userId: string, operation: any, version: number, timestamp: number, kafkaContent?: any) {
    // SIMPLIFIED APPROACH: Only use the authoritative content from WebSocket
    // No more operation replay - single source of truth
    
    if (!kafkaContent) {
      console.log(`No content provided in Kafka message for document ${documentId}, skipping update`);
      return;
    }

    // Update document with the authoritative content from WebSocket
    const updated = await prisma.documents.update({
      where: { id: documentId },
      data: {
        content: kafkaContent as any,
        lastEditedBy: userId,
        version,
        updatedAt: new Date(timestamp)
      }
    });

    console.log(`Updated document ${documentId} to version ${version} with authoritative content from WebSocket`);
    
    // Optional: Still store operations for audit/analytics purposes (not for replay)
    try {
      await prisma.document_operations.create({
        data: {
          documentId,
          userId,
          operation,
          version,
          revisionId: updated.revisionId,
          timestamp: new Date(timestamp)
        }
      });
    } catch (error) {
      console.error('Failed to store operation for audit:', error);
      // Don't fail the update if audit logging fails
    }
  }

  private async deleteDocument(documentId: string, userId: string, timestamp: number) {
    await prisma.documents.update({
      where: { id: documentId },
      data: {
        deletedAt: new Date(timestamp),
        lastEditedBy: userId,
        updatedAt: new Date(timestamp)
      }
    });

    console.log(`Deleted document ${documentId}`);
  }

  async shutdown() {
    console.log('Shutting down worker...');
    await consumer.disconnect();
    await prisma.$disconnect();
  }

  // REMOVED: Complex operation reconstruction logic
  // We now use authoritative content snapshots from WebSocket instead of operation replay

}

// Start worker
const worker = new DocumentWorker();

// Graceful shutdown
process.on('SIGINT', async () => {
  await worker.shutdown();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await worker.shutdown();
  process.exit(0);
});

// Start the worker
worker.start().catch(console.error);