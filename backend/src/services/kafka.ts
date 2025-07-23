import { Kafka } from "kafkajs";

const kafka = new Kafka({
  clientId: "neodocs-app",
  // brokers: (process.env.KAFKA_BROKERS || "kafka:9092").split(","),
  brokers: ["kafka:29092"],
});

export const producer = kafka.producer();
export const consumer = kafka.consumer({ groupId: "document-processor" });

// Document operation event types
export interface DocumentOperation {
  type: "CREATE" | "UPDATE" | "DELETE";
  documentId: string;
  userId: string;
  content?: any;
  operation?: any;
  version: number;
  timestamp: number;
  activities?: Array<{
    type: string;
    description: string;
    metadata: any;
  }>;
}

export interface DocumentEvent {
  type: "USER_JOIN" | "USER_LEAVE" | "CURSOR_UPDATE" | "TITLE_UPDATE";
  documentId: string;
  userId: string;
  data?: any;
  title?: string;
  timestamp: number;
}

// Topic names
export const TOPICS = {
  DOCUMENT_OPERATIONS: "document-operations",
  DOCUMENT_EVENTS: "document-events",
};

export class KafkaService {
  private static instance: KafkaService;
  private isProducerConnected = false;

  static getInstance(): KafkaService {
    if (!KafkaService.instance) {
      KafkaService.instance = new KafkaService();
    }
    return KafkaService.instance;
  }

  async connectProducer(): Promise<void> {
    if (!this.isProducerConnected) {
      await producer.connect();
      this.isProducerConnected = true;
      console.log("Kafka producer connected");
    }
  }

  async disconnectProducer(): Promise<void> {
    if (this.isProducerConnected) {
      await producer.disconnect();
      this.isProducerConnected = false;
      console.log("Kafka producer disconnected");
    }
  }

  async publishDocumentOperation(operation: DocumentOperation): Promise<void> {
    try {
      await this.connectProducer();

      const result = await producer.send({
        topic: TOPICS.DOCUMENT_OPERATIONS,
        messages: [
          {
            key: operation.documentId,
            value: JSON.stringify(operation),
          },
        ],
      });

      console.log(
        "Document operation published:",
        operation.type,
        operation.documentId
      );
      console.log("*********** RESULT IS: ", result, " ************");
    } catch (error) {
      console.error("Failed to publish document operation:", error);
      throw error;
    }
  }

  async publishDocumentEvent(event: DocumentEvent): Promise<void> {
    try {
      await this.connectProducer();

      await producer.send({
        topic: TOPICS.DOCUMENT_EVENTS,
        messages: [
          {
            key: event.documentId,
            value: JSON.stringify(event),
          },
        ],
      });

      console.log("Document event published:", event.type, event.documentId);
    } catch (error) {
      console.error("Failed to publish document event:", error);
      throw error;
    }
  }

  // Simple partition strategy based on document ID hash
  private getPartition(documentId: string): number {
    let hash = 0;
    for (let i = 0; i < documentId.length; i++) {
      const char = documentId.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash) % 3; // Assume 3 partitions
  }
}

export const kafkaService = KafkaService.getInstance();
