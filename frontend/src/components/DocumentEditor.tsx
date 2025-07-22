import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Step } from "prosemirror-transform";
import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import type {
  CollaboratorInfo,
  ContentSyncData,
  CursorUpdateData,
  DocumentEditorProps,
  DocumentStateData,
  OperationEventData,
} from "../types/editor";
import "./DocumentEditor.css";
import EditHistorySidebar from "./EditHistorySidebar";
import EditorToolbar from "./EditorToolbar";
import ShareDocumentModal from "./ShareDocumentModal";
import {
  DocumentArea,
  DocumentContainer,
  DocumentContent,
  DocumentWrapper,
  EditorContainer,
  StyledEditorContent,
} from "./styled/EditorComponents";

export default function DocumentEditor({
  documentId,
  userId,
  initialContent,
  onContentChange,
  title,
  onTitleChange,
  onTitleSave,
}: DocumentEditorProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [collaborators, setCollaborators] = useState<
    Map<string, CollaboratorInfo>
  >(new Map());
  const [documentVersion, setDocumentVersion] = useState(0);
  const [isHistorySidebarOpen, setIsHistorySidebarOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const isReceivingRef = useRef(false);

  const editor = useEditor({
    extensions: [StarterKit],
    content: (() => {
      if (!initialContent) {
        return { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Start writing...' }] }] };
      }
      
      // If already an object, use as-is
      if (typeof initialContent === 'object') {
        return initialContent;
      }
      
      // If string, try to parse as JSON
      if (typeof initialContent === 'string') {
        try {
          return JSON.parse(initialContent);
        } catch {
          // If JSON parsing fails, treat as plain text
          return { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: initialContent }] }] };
        }
      }
      
      // Fallback
      return { type: 'doc', content: [{ type: 'paragraph' }] };
    })(),
    onUpdate: ({ editor, transaction }) => {
      // Skip if we're receiving external changes
      if (isReceivingRef.current) {
        return;
      }

      const content = editor.getJSON();
      console.log('📝 Editor content changed:', JSON.stringify(content, null, 2));
      onContentChange?.(content);

      // Send ProseMirror steps for real-time collaboration
      if (socket && isConnected && transaction.steps.length > 0) {
        const steps = transaction.steps.map((step) => step.toJSON());

        socket.emit("operation", {
          docId: documentId,
          operation: {
            steps,
            clientID: userId,
          },
          version: documentVersion,
          userId,
          // Send the complete document content to ensure consistency
          content: content,
        });
      }
    },
    onSelectionUpdate: ({ editor }) => {
      // Send cursor/selection updates
      if (socket && isConnected && !isReceivingRef.current) {
        const { from, to } = editor.state.selection;

        socket.emit("cursor-update", {
          docId: documentId,
          userId,
          cursor: from,
          selection: { from, to },
        });
      }
    },
  });

  useEffect(() => {
    if (!userId) return;

    // Initialize socket connection with authentication
    const token = localStorage.getItem("token");
    const newSocket = io(
      import.meta.env.VITE_SOCKET_URL || "http://localhost:3001",
      {
        auth: {
          token: token,
        },
      }
    );
    setSocket(newSocket);

    // Expose socket to window for EditHistorySidebar
    (window as any).documentSocket = newSocket;

    newSocket.on("connect", () => {
      setIsConnected(true);
      newSocket.emit("join-document", { docId: documentId });
    });

    newSocket.on("disconnect", () => {
      setIsConnected(false);
    });

    // Receive initial document state
    newSocket.on("document-state", (data: DocumentStateData) => {
      console.log('📥 Received document state:', JSON.stringify(data, null, 2));
      setDocumentVersion(data.version);
      if (editor && data.content) {
        isReceivingRef.current = true;
        console.log('📄 Setting editor content from WebSocket:', JSON.stringify(data.content, null, 2));
        editor.commands.setContent(data.content, false);
        isReceivingRef.current = false;
      }
    });

    // Receive operations from other users
    newSocket.on("operation", (data: OperationEventData) => {
      if (editor && data.userId !== userId) {
        isReceivingRef.current = true;

        try {
          // Apply the steps to our editor
          const { steps } = data.operation;
          if (steps && Array.isArray(steps)) {
            const tr = editor.state.tr;

            for (const stepJSON of steps) {
              const step = Step.fromJSON(editor.schema, stepJSON);
              if (step) {
                tr.step(step);
              }
            }

            if (tr.steps.length > 0) {
              editor.view.dispatch(tr);
            }
          }

          setDocumentVersion(data.version);
        } catch (error) {
          console.error("Failed to apply operation:", error);
          // Fallback to content sync
          requestContentSync();
        } finally {
          isReceivingRef.current = false;
        }
      }
    });

    // Handle operation acknowledgments
    newSocket.on("operation-ack", (data: { version: number }) => {
      setDocumentVersion(data.version);
    });

    // Handle operation rejections
    newSocket.on(
      "operation-rejected",
      (data: { reason: string; currentVersion: number }) => {
        console.warn("Operation rejected:", data.reason);
        setDocumentVersion(data.currentVersion);
        requestContentSync();
      }
    );

    // Handle content sync (fallback)
    newSocket.on("content-sync", (data: ContentSyncData) => {
      if (editor && data.userId !== userId) {
        isReceivingRef.current = true;
        editor.commands.setContent(data.content, false);
        setDocumentVersion(data.version);
        isReceivingRef.current = false;
      }
    });

    // Handle user presence
    newSocket.on(
      "user-joined",
      (data: { userId: string; socketId: string }) => {
        setCollaborators((prev) => {
          const updated = new Map(prev);
          updated.set(data.socketId, {
            userId: data.userId,
            socketId: data.socketId,
          });
          return updated;
        });
      }
    );

    newSocket.on("user-left", (data: { userId: string; socketId: string }) => {
      setCollaborators((prev) => {
        const updated = new Map(prev);
        updated.delete(data.socketId);
        return updated;
      });
    });

    newSocket.on("cursor-update", (data: CursorUpdateData) => {
      setCollaborators((prev) => {
        const updated = new Map(prev);
        const existing = updated.get(data.socketId);
        if (existing) {
          updated.set(data.socketId, {
            ...existing,
            cursor: data.cursor,
            selection: data.selection,
          });
        }
        return updated;
      });
    });

    const requestContentSync = () => {
      if (editor) {
        newSocket.emit("content-sync", {
          docId: documentId,
          content: editor.getJSON(),
          userId,
        });
      }
    };

    return () => {
      newSocket.disconnect();
    };
  }, [documentId, userId, editor]);

  useEffect(() => {
    if (editor && initialContent) {
      console.log('🎯 Setting initial content from props:', typeof initialContent, JSON.stringify(initialContent, null, 2));
      isReceivingRef.current = true;
      try {
        let content;
        
        if (typeof initialContent === 'object') {
          content = initialContent;
        } else if (typeof initialContent === 'string') {
          try {
            content = JSON.parse(initialContent);
          } catch {
            // If JSON parsing fails, create a TipTap doc with the text
            content = { 
              type: 'doc', 
              content: [{ 
                type: 'paragraph', 
                content: [{ type: 'text', text: initialContent }] 
              }] 
            };
          }
        } else {
          content = initialContent;
        }
        
        console.log('🔄 Final content being set:', JSON.stringify(content, null, 2));
        editor.commands.setContent(content, false);
      } catch (error) {
        console.error('Failed to set content:', error);
        // Fallback to empty paragraph
        editor.commands.setContent({ type: 'doc', content: [{ type: 'paragraph' }] }, false);
      }
      isReceivingRef.current = false;
    }
  }, [editor, initialContent]);

  return (
    <EditorContainer>
      {/* Editor Toolbar */}
      <EditorToolbar
        editor={editor}
        isConnected={isConnected}
        documentVersion={documentVersion}
        collaborators={collaborators}
        userId={userId}
        title={title}
        onTitleChange={onTitleChange}
        onTitleSave={onTitleSave}
        onHistoryToggle={() => setIsHistorySidebarOpen(!isHistorySidebarOpen)}
        isHistoryOpen={isHistorySidebarOpen}
        onShareToggle={() => setIsShareModalOpen(true)}
      />

      {/* Centered Document-like Editor */}
      <DocumentArea>
        <DocumentWrapper>
          <DocumentContainer>
            <DocumentContent>
              <StyledEditorContent editor={editor} className="scribe-editor" />
            </DocumentContent>
          </DocumentContainer>
        </DocumentWrapper>
      </DocumentArea>

      {/* Edit History Sidebar */}
      <EditHistorySidebar
        documentId={documentId}
        isOpen={isHistorySidebarOpen}
        onClose={() => setIsHistorySidebarOpen(false)}
      />

      {/* Share Document Modal */}
      <ShareDocumentModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        documentId={documentId}
        documentTitle={title || "Untitled Document"}
      />
    </EditorContainer>
  );
}
