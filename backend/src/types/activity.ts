// Activity types for live edit history
export type ActivityType =
  | "document_opened"
  | "text_inserted"
  | "text_added"
  | "text_deleted"
  | "text_formatted"
  | "heading_added"
  | "list_created"
  | "user_joined"
  | "user_left"
  | "document_created"
  | "document_updated";

export interface ActivityMetadata {
  // Text operations
  text?: string;
  textLength?: number;
  position?: number;

  // Formatting operations
  format?: string;
  formatType?: "bold" | "italic" | "underline" | "heading";

  // Structure operations
  nodeType?: "paragraph" | "heading" | "list" | "blockquote";
  level?: number; // For headings

  // User presence
  socketId?: string;
}

export interface DocumentActivity {
  id: string;
  documentId: string;
  userId: string;
  type: ActivityType;
  timestamp: Date;
  metadata?: ActivityMetadata;
  createdAt: Date;

  // User information
  user?: {
    firstName?: string;
    lastName?: string;
    email: string;
  };
}

export interface ActivityAnalysis {
  type: ActivityType;
  description: string;
  metadata: ActivityMetadata;
}

// Helper function to analyze ProseMirror operations and create human-readable activities
export function analyzeProseMirrorOperation(
  operation: any,
  userId: string
): ActivityAnalysis[] {
  const activities: ActivityAnalysis[] = [];

  if (!operation.steps || operation.steps.length === 0) {
    return activities;
  }

  for (const step of operation.steps) {
    if (step.stepType === "replace") {
      const analysis = analyzeReplaceStep(step);
      if (analysis) {
        activities.push(analysis);
      }
    }
  }

  return activities;
}

function analyzeReplaceStep(step: any): ActivityAnalysis | null {
  try {
    const from = step.from || 0;
    const to = step.to || 0;
    let insertText = "";
    let isFormatting = false;
    let formatType: string | undefined;

    // Extract insertion content
    if (step.slice?.content) {
      for (const node of step.slice.content) {
        if (node.content) {
          // Handle paragraph/block content
          for (const textNode of node.content) {
            if (textNode.type === "text") {
              insertText += textNode.text || "";
              // Check for formatting marks
              if (textNode.marks) {
                isFormatting = true;
                formatType = textNode.marks[0]?.type || "unknown";
              }
            }
          }
        } else if (node.type === "text") {
          insertText += node.text || "";
          if (node.marks) {
            isFormatting = true;
            formatType = node.marks[0]?.type || "unknown";
          }
        }

        // Check for structural changes
        if (node.type === "heading") {
          return {
            type: "heading_added",
            description: `Added heading level ${node.attrs?.level || 1}`,
            metadata: {
              nodeType: "heading",
              level: node.attrs?.level || 1,
              text: insertText,
              position: from,
            },
          };
        }

        if (node.type === "bullet_list" || node.type === "ordered_list") {
          return {
            type: "list_created",
            description: `Created ${node.type.replace("_", " ")}`,
            metadata: {
              nodeType: "list",
              text: insertText,
              position: from,
            },
          };
        }
      }
    }

    // Determine activity type based on operation
    const isDelete = to > from && !insertText;
    const isInsert = insertText && to === from;
    const isReplace = insertText && to > from;

    if (isFormatting && formatType) {
      return {
        type: "text_formatted",
        description: `Applied ${formatType} formatting`,
        metadata: {
          format: formatType,
          text: insertText,
          position: from,
          textLength: insertText.length,
        },
      };
    }

    if (isDelete) {
      const deletedLength = to - from;
      return {
        type: "text_deleted",
        description: `Deleted ${deletedLength} character${
          deletedLength > 1 ? "s" : ""
        }`,
        metadata: {
          position: from,
          textLength: deletedLength,
        },
      };
    }

    if (isInsert) {
      // For single characters or small insertions, show the text
      if (insertText.length <= 3) {
        return {
          type: "text_inserted", 
          description: `Inserted text: "${insertText}"`,
          metadata: {
            text: insertText,
            position: from,
            textLength: insertText.length,
          },
        };
      }
      
      // For larger insertions (likely threshold-triggered), show a summary
      return {
        type: "text_added",
        description: `Added ${insertText.length} characters of text`,
        metadata: {
          text: insertText.length > 50 ? insertText.substring(0, 50) + "..." : insertText,
          position: from,
          textLength: insertText.length,
        },
      };
    }

    if (isReplace) {
      const deletedLength = to - from;
      return {
        type: "text_inserted", // Could be 'text_replaced' but keeping simple
        description: `Replaced ${deletedLength} character${
          deletedLength > 1 ? "s" : ""
        } with "${insertText}"`,
        metadata: {
          text: insertText,
          position: from,
          textLength: insertText.length,
        },
      };
    }

    return null;
  } catch (error) {
    console.error("Failed to analyze replace step:", error);
    return null;
  }
}

// Helper to generate human-readable activity descriptions
export function getActivityDescription(activity: DocumentActivity): string {
  const userName = activity.user
    ? `${activity.user.firstName} ${activity.user.lastName}`.trim() ||
      activity.user.email
    : "Someone";

  switch (activity.type) {
    case "user_joined":
      return `${userName} joined the document`;

    case "user_left":
      return `${userName} left the document`;

    case "document_opened":
      return `${userName} opened the document`;

    case "text_inserted":
      if (activity.metadata?.text) {
        const text = activity.metadata.text;
        const preview = text.length > 30 ? `${text.substring(0, 30)}...` : text;
        return `${userName} added: "${preview}"`;
      }
      return `${userName} added text`;

    case "text_deleted":
      const length = activity.metadata?.textLength || 0;
      return `${userName} deleted ${length} character${
        length !== 1 ? "s" : ""
      }`;

    case "text_formatted":
      const format = activity.metadata?.format || "formatting";
      return `${userName} applied ${format}`;

    case "heading_added":
      const level = activity.metadata?.level || 1;
      return `${userName} added heading ${level}`;

    case "list_created":
      return `${userName} created a list`;

    default:
      return `${userName} made a change`;
  }
}
