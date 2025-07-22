import type { JSONContent } from "@tiptap/react";
import { Editor } from "@tiptap/react";

export interface DocumentEditorProps {
  documentId: string;
  userId: string;
  initialContent?: JSONContent;
  onContentChange?: (content: JSONContent) => void;
  title?: string;
  onTitleChange?: (title: string) => void;
  onTitleSave?: () => void;
}

export interface CursorPosition {
  from: number;
  to: number;
}

export interface CollaboratorInfo {
  userId: string;
  socketId: string;
  cursor?: number;
  selection?: CursorPosition;
}

export interface OperationData {
  steps: Array<Record<string, unknown>>;
  clientID: string;
}

export interface DocumentStateData {
  version: number;
  content: JSONContent | null;
}

export interface OperationEventData {
  operation: OperationData;
  version: number;
  userId: string;
  timestamp: number;
}

export interface ContentSyncData {
  content: JSONContent;
  version: number;
  userId: string;
}

export interface CursorUpdateData {
  userId: string;
  socketId: string;
  cursor: number;
  selection: CursorPosition;
}

export interface EditorToolbarProps {
  editor: Editor | null;
  isConnected: boolean;
  documentVersion: number;
  collaborators: Map<string, CollaboratorInfo>;
  userId: string;
  title?: string;
  onTitleChange?: (title: string) => void;
  onTitleSave?: () => void;
  onHistoryToggle?: () => void;
  isHistoryOpen?: boolean;
  onShareToggle?: () => void;
}

export interface Document {
  id: string;
  title: string;
  content: any;
  author?: {
    id: string;
    email: string;
  };
  lastEditor?: {
    id: string;
    email: string;
  } | null;
  shares?: Array<{
    user: {
      id: string;
      email: string;
    };
    permission: string;
  }>;
  createdAt: string;
  updatedAt: string;
}