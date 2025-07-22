import type { FastifyInstance } from "fastify";
import { Server } from "socket.io";
import { kafkaService } from "../services/kafka.ts";
import { analyzeProseMirrorOperation, type ActivityType } from "../types/activity.ts";
import { getPrismaClient } from "../utils/database.ts";

// Store document states and operation queues
const documentStates = new Map<
  string,
  {
    version: number;
    content: any;
    pendingOps: Array<{
      operation: any;
      userId: string;
      version: number;
      timestamp: number;
    }>;
  }
>();

// Store user presence information
const userPresence = new Map<
  string,
  Map<
    string,
    {
      userId: string;
      cursor: any;
      selection: any;
      lastSeen: number;
    }
  >
>();

export const registerSocketEvents = (io: Server, app: FastifyInstance) => {
  // Authentication middleware for WebSocket connections
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth.token ||
        socket.handshake.headers.authorization?.replace("Bearer ", "");

      if (!token) {
        return next(new Error("Authentication token required"));
      }

      // Verify JWT token using Fastify's JWT instance
      const decoded = app.jwt.verify(token) as any;
      socket.data.userId = decoded.id;
      socket.data.userEmail = decoded.email || "unknown";

      next();
    } catch (err) {
      console.error("WebSocket authentication failed:", err);
      next(new Error("Invalid authentication token"));
    }
  });

  io.on("connection", (socket) => {
    console.log(
      "Authenticated user connected:",
      socket.id,
      "User:",
      socket.data.userId
    );

    // Join document room
    socket.on("join-document", async (data: { docId: string }) => {
      const { docId } = data;
      const userId = socket.data.userId; // Use authenticated user ID
      socket.join(docId);

      // Initialize document state if not exists
      if (!documentStates.has(docId)) {
        try {
          // Load document content from database
          const prisma = getPrismaClient();
          const document = await prisma.documents.findUnique({
            where: { id: docId }
          });
          
          console.log(`🔍 Loading document ${docId} from database:`, {
            found: !!document,
            version: document?.version,
            contentType: typeof document?.content,
            content: document?.content
          });
          
          documentStates.set(docId, {
            version: document?.version || 0,
            content: document?.content || { type: 'doc', content: [{ type: 'paragraph' }] },
            pendingOps: [],
          });
        } catch (error) {
          console.error('Failed to load document content:', error);
          // Fallback to empty state
          documentStates.set(docId, {
            version: 0,
            content: { type: 'doc', content: [{ type: 'paragraph' }] },
            pendingOps: [],
          });
        }
      }

      // Initialize user presence for document
      if (!userPresence.has(docId)) {
        userPresence.set(docId, new Map());
      }

      const docPresence = userPresence.get(docId)!;
      docPresence.set(socket.id, {
        userId,
        cursor: null,
        selection: null,
        lastSeen: Date.now(),
      });

      // Send current document state to joining user
      const docState = documentStates.get(docId)!;
      console.log(`📤 Sending document state to client:`, {
        docId,
        version: docState.version,
        contentType: typeof docState.content,
        content: docState.content
      });
      socket.emit("document-state", {
        version: docState.version,
        content: docState.content,
      });

      // Publish user join event to Kafka
      try {
        await kafkaService.publishDocumentEvent({
          type: "USER_JOIN",
          documentId: docId,
          userId,
          timestamp: Date.now(),
        });
      } catch (error) {
        console.error("Failed to publish user join event to Kafka:", error);
      }

      // Broadcast user joined activity for live history
      io.to(docId).emit("document-activity", {
        id: `join-${Date.now()}-${Math.random()}`,
        documentId: docId,
        userId,
        type: "user_joined" as ActivityType,
        timestamp: new Date(),
        metadata: { socketId: socket.id },
        description: `joined the document`,
      });

      // Notify others of new user
      socket.to(docId).emit("user-joined", {
        userId,
        socketId: socket.id,
      });

      console.log(`User ${userId} joined document ${docId}`);
    });

    // Handle ProseMirror operations
    socket.on(
      "operation",
      async (data: {
        docId: string;
        operation: any;
        version: number;
        userId: string;
        content?: any;
      }) => {
        const { docId, operation, version, userId, content } = data;
        const docState = documentStates.get(docId);

        if (!docState) {
          socket.emit("error", { message: "Document not found" });
          return;
        }

        // Handle version conflicts - accept all operations for simplicity
        if (version !== docState.version) {
          console.log(`Operation version mismatch: client=${version}, server=${docState.version}. Proceeding with operation.`);
        }

        // Apply operation to document state
        docState.version++;
        const timestamp = Date.now();
        
        // Update document content - use complete content if available, otherwise apply operation
        console.log(`Before applying operation - docState.content:`, JSON.stringify(docState.content));
        if (content) {
          // Use the complete document content sent by the client (preserves formatting)
          console.log(`🔄 Using complete content from client:`, JSON.stringify(content));
          docState.content = content;
        } else {
          // Fallback to applying ProseMirror steps (may lose formatting)
          console.log(`⚠️  Falling back to ProseMirror step application`);
          docState.content = applyOperationToContent(docState.content, operation);
        }
        console.log(`After applying operation - docState.content:`, JSON.stringify(docState.content));
        
        docState.pendingOps.push({
          operation,
          userId,
          version: docState.version,
          timestamp,
        });

        // Analyze operation for activity tracking
        const activities = analyzeProseMirrorOperation(operation, userId);
        
        // Publish to Kafka for persistence
        try {
          const kafkaMessage = {
            type: "UPDATE" as const,
            documentId: docId,
            userId,
            content: docState.content, // Include current document content
            operation,
            version: docState.version,
            timestamp,
            activities, // Include parsed activities
          };
          console.log(`Publishing to Kafka with content:`, JSON.stringify(kafkaMessage.content));
          await kafkaService.publishDocumentOperation(kafkaMessage);
        } catch (error) {
          console.error("Failed to publish operation to Kafka:", error);
        }

        // Broadcast activities to clients for live history
        if (activities.length > 0) {
          for (const activity of activities) {
            io.to(docId).emit("document-activity", {
              id: `${timestamp}-${Math.random()}`, // Temporary ID
              documentId: docId,
              userId,
              type: activity.type,
              timestamp: new Date(timestamp),
              metadata: activity.metadata,
              description: activity.description,
            });
          }
        }

        // Broadcast operation to other clients in the room
        socket.to(docId).emit("operation", {
          operation,
          version: docState.version,
          userId,
          timestamp,
        });

        // Acknowledge to sender
        socket.emit("operation-ack", {
          version: docState.version,
        });

        console.log(
          `Operation applied to document ${docId}, new version: ${docState.version}`
        );
      }
    );

    // Handle cursor/selection updates
    socket.on(
      "cursor-update",
      (data: {
        docId: string;
        userId: string;
        cursor: any;
        selection: any;
      }) => {
        const { docId, userId, cursor, selection } = data;
        const docPresence = userPresence.get(docId);

        if (docPresence && docPresence.has(socket.id)) {
          const userInfo = docPresence.get(socket.id)!;
          userInfo.cursor = cursor;
          userInfo.selection = selection;
          userInfo.lastSeen = Date.now();

          // Broadcast cursor update to others
          socket.to(docId).emit("cursor-update", {
            userId,
            socketId: socket.id,
            cursor,
            selection,
          });
        }
      }
    );

    // Handle content sync (fallback for when operations fail)
    socket.on(
      "content-sync",
      (data: { docId: string; content: any; userId: string }) => {
        const { docId, content, userId } = data;
        const docState = documentStates.get(docId);

        if (docState) {
          docState.content = content;
          docState.version++;

          // Broadcast content update
          socket.to(docId).emit("content-sync", {
            content,
            version: docState.version,
            userId,
          });

          console.log(`Content synced for document ${docId}`);
        }
      }
    );

    // Clean up on disconnect
    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);

      // Remove from all document presences
      for (const [docId, docPresence] of userPresence.entries()) {
        if (docPresence.has(socket.id)) {
          const userInfo = docPresence.get(socket.id)!;
          docPresence.delete(socket.id);

          // Notify others of user leaving
          socket.to(docId).emit("user-left", {
            userId: userInfo.userId,
            socketId: socket.id,
          });

          // Broadcast user left activity for live history
          socket.to(docId).emit("document-activity", {
            id: `leave-${Date.now()}-${Math.random()}`,
            documentId: docId,
            userId: userInfo.userId,
            type: "user_left" as ActivityType,
            timestamp: new Date(),
            metadata: { socketId: socket.id },
            description: `left the document`,
          });
        }
      }
    });
  });
};

// Apply ProseMirror operation to document content - WORKING VERSION
function applyOperationToContent(currentContent: any, operation: any): any {
  // If no content exists, create basic document structure
  if (!currentContent) {
    currentContent = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: []
        }
      ]
    };
  }

  try {
    if (operation.steps && operation.steps.length > 0) {
      // Extract current text content
      let currentText = extractTextFromContent(currentContent);
      
      // Apply each step to the current text
      for (const step of operation.steps) {
        if (step.stepType === 'replace') {
          currentText = applyReplaceStep(currentText, step);
        }
      }
      
      // Update the document content with the modified text
      return {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: currentText ? [{ type: "text", text: currentText }] : []
          }
        ]
      };
    }

    return currentContent;
  } catch (error) {
    console.error('Failed to apply operation to content:', error);
    return currentContent;
  }
}

// Extract text content from ProseMirror document
function extractTextFromContent(content: any): string {
  if (!content || !content.content) return "";
  
  let text = "";
  for (const node of content.content) {
    if (node.content) {
      for (const textNode of node.content) {
        if (textNode.type === 'text' && textNode.text) {
          text += textNode.text;
        }
      }
    }
  }
  return text;
}

// Apply replace step with conflict resolution (last-writer-wins)
function applyReplaceStep(currentText: string, step: any): string {
  try {
    const from = step.from || 0;
    const to = step.to || 0;
    
    // Extract insertion text (handle both insertions and deletions)
    let insertText = "";
    if (step.slice) {
      if (step.slice.content && step.slice.content.length > 0) {
        // This is an insertion or replacement
        for (const node of step.slice.content) {
          if (node.content) {
            // Handle paragraph content
            for (const textNode of node.content) {
              if (textNode.type === 'text' && textNode.text) {
                insertText += textNode.text;
              }
            }
          } else if (node.type === 'text' && node.text) {
            // Handle direct text nodes
            insertText += node.text;
          }
        }
      }
      // If slice.content is empty or undefined, this is a pure deletion (insertText stays "")
    }
    
    // ProseMirror positions include document structure - adjust for plain text
    // Position 1 in ProseMirror doc usually means the first character (after paragraph start)
    const textFrom = Math.max(0, from - 1); // Convert ProseMirror pos to text pos
    const textTo = Math.max(0, to - 1);     // Convert ProseMirror pos to text pos
    
    // Apply bounds checking 
    const safeFrom = Math.max(0, Math.min(textFrom, currentText.length));
    const safeTo = Math.max(safeFrom, Math.min(textTo, currentText.length));
    
    // Debug position calculation
    console.log(`Position calc: text="${currentText}" (len=${currentText.length}), proseMirror[${from}:${to}] -> text[${safeFrom}:${safeTo}]`);
    
    const result = currentText.substring(0, safeFrom) + insertText + currentText.substring(safeTo);
    
    // Enhanced debugging for deletions
    if (insertText === "") {
      console.log(`DELETE operation: "${currentText}" [${safeFrom}:${safeTo}] -> "${result}" (deleted: "${currentText.substring(safeFrom, safeTo)}")`);
    } else {
      console.log(`INSERT/REPLACE operation: "${currentText}" [${safeFrom}:${safeTo}] -> "${result}" (inserted: "${insertText}")`);
    }
    
    return result;
  } catch (error) {
    console.error('Failed to apply replace step:', error);
    return currentText;
  }
}