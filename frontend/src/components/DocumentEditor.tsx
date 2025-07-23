import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Step } from "prosemirror-transform";
import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { Transaction } from "@tiptap/pm/state";
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

// Track character changes and time-based snapshots  
let lastSaveTime = Date.now();
let charactersSinceLastSave = 0;
let textSinceLastSave = "";

// Helper function to determine if an edit is significant enough to track
function isSignificantEdit(transaction: Transaction, editor: any): boolean {
  if (!transaction.steps || transaction.steps.length === 0 || !editor) {
    return false;
  }

  const currentTime = Date.now();
  const timeSinceLastSave = currentTime - lastSaveTime;
  
  // Track structural changes (headings, lists, formatting - always significant)
  for (const step of transaction.steps) {
    const stepJSON = step.toJSON();
    
    // Always track non-text operations (formatting, structure changes)
    if (stepJSON.stepType !== "replace") {
      console.log('✅ Structural change detected - always significant');
      resetCounters();
      return true;
    }
    
    // For text insertions, track character count and time
    if (stepJSON.from !== undefined && stepJSON.slice?.content) {
      // Track heading and list additions
      for (const node of stepJSON.slice.content) {
        if (node.type === "heading" || node.type === "bulletList" || node.type === "orderedList") {
          console.log('✅ Heading/List detected - always significant');
          resetCounters();
          return true;
        }
      }
      
      // Calculate text length added
      const insertedText = stepJSON.slice.content
        .filter((n: any) => n.type === "text" || (n.content && n.content.some((c: any) => c.type === "text")))
        .map((n: any) => {
          if (n.type === "text") return n.text || "";
          if (n.content) return n.content.filter((c: any) => c.type === "text").map((c: any) => c.text || "").join("");
          return "";
        })
        .join("");

      // Add to character count and accumulate text
      charactersSinceLastSave += insertedText.length;
      textSinceLastSave += insertedText;
      
      console.log('📊 Tracking stats:', {
        insertedLength: insertedText.length,
        totalCharsSinceLastSave: charactersSinceLastSave,
        timeSinceLastSave: Math.round(timeSinceLastSave / 1000) + 's',
        timeThreshold: '180s (3min)',
        charThreshold: '200 chars'
      });

      // Check time threshold (3 minutes = 180,000ms)
      if (timeSinceLastSave >= 180000) {
        console.log('✅ Time threshold reached - 3 minutes elapsed');
        resetCounters();
        return true;
      }
      
      // Check character threshold (200 characters)
      if (charactersSinceLastSave >= 200) {
        console.log('✅ Character threshold reached - 200+ characters written');
        resetCounters();
        return true;
      }

      // Always track line breaks
      if (insertedText.includes("\n")) {
        console.log('✅ Line break detected');
        resetCounters();
        return true;
      }
    }
  }
  
  return false;
}

function resetCounters() {
  lastSaveTime = Date.now();
  charactersSinceLastSave = 0;
  textSinceLastSave = "";
}


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
        return {
          type: "doc",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "Start writing..." }],
            },
          ],
        };
      }

      // If already an object, use as-is
      if (typeof initialContent === "object") {
        return initialContent;
      }

      // If string, try to parse as JSON
      if (typeof initialContent === "string") {
        try {
          return JSON.parse(initialContent);
        } catch {
          // If JSON parsing fails, treat as plain text
          return {
            type: "doc",
            content: [
              {
                type: "paragraph",
                content: [{ type: "text", text: initialContent }],
              },
            ],
          };
        }
      }

      // Fallback
      return { type: "doc", content: [{ type: "paragraph" }] };
    })(),
    onUpdate: ({ editor, transaction }) => {
      // Skip if we're receiving external changes
      if (isReceivingRef.current) {
        return;
      }

      const content = editor.getJSON();
      // console.log('📝 Editor content changed:', JSON.stringify(content, null, 2));
      onContentChange?.(content);

      // Send ProseMirror steps for real-time collaboration
      if (socket && isConnected && transaction.steps.length > 0) {
        const steps = transaction.steps.map((step) => step.toJSON());

        const isSignificant = isSignificantEdit(transaction, editor);
        
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
          // Add metadata for smart history tracking
          isSignificant: isSignificant,
          // Send accumulated text context when threshold reached
          accumulatedText: isSignificant ? textSinceLastSave : undefined,
          accumulatedChars: isSignificant ? charactersSinceLastSave : undefined,
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
      // console.log('📥 Received document state:', JSON.stringify(data, null, 2));
      setDocumentVersion(data.version);
      if (editor && data.content) {
        isReceivingRef.current = true;
        // console.log('📄 Setting editor content from WebSocket:', JSON.stringify(data.content, null, 2));
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
      (data: {
        userId: string;
        socketId: string;
        firstName?: string;
        lastName?: string;
      }) => {
        setCollaborators((prev) => {
          const updated = new Map(prev);
          updated.set(data.socketId, {
            userId: data.userId,
            socketId: data.socketId,
            firstName: data.firstName,
            lastName: data.lastName,
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

    // Handle title updates from other users
    newSocket.on("title-update", (data: { title: string; userId: string }) => {
      if (data.userId !== userId) {
        onTitleChange?.(data.title);
      }
    });

    // Handle title update acknowledgments
    newSocket.on("title-update-ack", (data: { title: string }) => {
      console.log("Title update acknowledged:", data.title);
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
      // console.log('🎯 Setting initial content from props:', typeof initialContent, JSON.stringify(initialContent, null, 2));
      isReceivingRef.current = true;
      try {
        let content;

        if (typeof initialContent === "object") {
          content = initialContent;
        } else if (typeof initialContent === "string") {
          try {
            content = JSON.parse(initialContent);
          } catch {
            // If JSON parsing fails, create a TipTap doc with the text
            content = {
              type: "doc",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: initialContent }],
                },
              ],
            };
          }
        } else {
          content = initialContent;
        }

        // console.log(
        //   "🔄 Final content being set:",
        //   JSON.stringify(content, null, 2)
        // );
        editor.commands.setContent(content, false);
      } catch (error) {
        console.error("Failed to set content:", error);
        // Fallback to empty paragraph
        editor.commands.setContent(
          { type: "doc", content: [{ type: "paragraph" }] },
          false
        );
      }
      isReceivingRef.current = false;
    }
  }, [editor, initialContent]);

  const handleTitleSave = (titleToSave: string) => {
    if (socket && isConnected) {
      socket.emit("title-update", {
        docId: documentId,
        title: titleToSave,
        userId: userId,
      });
    } else {
      // Fallback to the original onTitleSave if WebSocket is not available
      onTitleSave?.();
    }
  };

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
        onTitleSave={() => handleTitleSave(title || "Untitled Document")}
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
