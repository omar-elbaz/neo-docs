import {
  AccountCircle,
  FormatBold,
  FormatItalic,
  FormatListBulleted,
  FormatListNumbered,
  History,
  Share,
} from "@mui/icons-material";
import {
  Avatar,
  IconButton,
  Tooltip,
  Typography,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { EditorToolbarProps } from "../types/editor";
import { apiClient } from "../lib/api";
import UserMenu from "./UserMenu";
import {
  AppHeaderContainer,
  AppHeaderContent,
  CollaboratorContainer,
  CompactDivider,
  CompactIconButton,
  FormattingContainer,
  FormattingToolbar,
  FormattingToolbarContainer,
  FormattingToolbarWrapper,
  LogoContainer,
  ScribeLogo,
  StatusContainer,
  StatusDot,
  StatusText,
  StyledFormattingAppBar,
  StyledTextField,
  TitleContainer,
  UserContainer,
} from "./styled/EditorComponents";

export default function EditorToolbar({
  editor,
  isConnected,
  documentVersion,
  collaborators,
  userId,
  title = "Untitled Document",
  onTitleChange,
  onTitleSave,
  onHistoryToggle,
  isHistoryOpen = false,
  onShareToggle,
}: EditorToolbarProps) {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    fullName?: string;
  } | null>(null);

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      const response = await apiClient.getCurrentUser();

      if (response.error) {
        console.error("Failed to fetch current user:", response.error);
        navigate("/login");
        return;
      }

      if (response.data) {
        setCurrentUser({
          id: response.data.userID,
          email: response.data.email,
          firstName: response.data.firstName,
          lastName: response.data.lastName,
          fullName: response.data.fullName,
        });
      }
    } catch (err) {
      console.error("Failed to fetch current user:", err);
      navigate("/login");
    }
  };

  if (!editor) {
    return null;
  }

  return (
    <>
      {/* App Header - Full width, flush with background */}
      <AppHeaderContainer>
        <AppHeaderContent>
          {/* Left: Logo and Document Title */}
          <TitleContainer>
            <LogoContainer onClick={() => (window.location.href = "/")}>
              <ScribeLogo>S</ScribeLogo>
            </LogoContainer>
            <StyledTextField
              value={title}
              onChange={(e) => onTitleChange?.(e.target.value)}
              onBlur={() => onTitleSave?.()}
              onKeyDown={(e) => e.key === "Enter" && onTitleSave?.()}
              variant="standard"
              placeholder="Untitled Document"
            />
          </TitleContainer>

          {/* Center: Connection Status */}
          <StatusContainer>
            <StatusDot isConnected={isConnected} />
            <StatusText>
              {isConnected ? "Connected" : "Disconnected"} · v{documentVersion}
            </StatusText>
          </StatusContainer>

          {/* Right: Collaborators and User Menu */}
          <UserContainer>
            {/* Collaborators */}
            {(() => {
              // Deduplicate collaborators by userId (same user might have multiple sockets)
              const uniqueCollaborators = new Map();
              Array.from(collaborators.values())
                .filter(collab => collab.userId !== userId)
                .forEach(collab => {
                  uniqueCollaborators.set(collab.userId, collab);
                });
              const otherCollaborators = Array.from(uniqueCollaborators.values());
              
              return otherCollaborators.length > 0 && (
                <CollaboratorContainer>
                  {otherCollaborators
                    .slice(0, 3)
                    .map((collab, index) => (
                      <Avatar
                        key={collab.socketId}
                        sx={{
                          width: 24,
                          height: 24,
                          fontSize: "0.6rem",
                          bgcolor: `hsl(${(index * 137.5) % 360}, 70%, 60%)`,
                        }}
                        title={`${collab.firstName || ''} ${collab.lastName || ''} (${collab.userId})`}
                      >
                        {(() => {
                          const firstInitial = collab.firstName?.[0]?.toUpperCase() || '';
                          const lastInitial = collab.lastName?.[0]?.toUpperCase() || '';
                          return firstInitial && lastInitial 
                            ? `${firstInitial}${lastInitial}`
                            : collab.userId?.substring(0, 2)?.toUpperCase() || 'U';
                        })()}
                      </Avatar>
                    ))}
                  {otherCollaborators.length > 3 && (
                    <Avatar
                      sx={{
                        width: 24,
                        height: 24,
                        fontSize: "0.6rem",
                        bgcolor: "grey.500",
                      }}
                    >
                      +{otherCollaborators.length - 3}
                    </Avatar>
                  )}
                </CollaboratorContainer>
              );
            })()}
            
            {/* Share Button */}
            <Tooltip title="Share Document">
              <IconButton 
                onClick={onShareToggle}
                size="small"
              >
                <Share sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
            
            {/* History Button */}
            <Tooltip title="Edit History">
              <IconButton 
                onClick={onHistoryToggle}
                size="small"
                color={isHistoryOpen ? "primary" : "default"}
              >
                <History sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>

            {/* User Menu */}
            <UserMenu user={currentUser} variant="avatar" size="small" />
          </UserContainer>
        </AppHeaderContent>
      </AppHeaderContainer>

      {/* Formatting Toolbar - Centered, compact */}
      <FormattingToolbarContainer>
        <FormattingToolbarWrapper>
          <StyledFormattingAppBar
            position="static"
            color="default"
            elevation={2}
          >
            <FormattingToolbar>
              <FormattingContainer>
                {/* Text Formatting */}
                <Tooltip title="Bold (Ctrl+B)">
                  <CompactIconButton
                    onClick={() => editor?.chain().focus().toggleBold().run()}
                    color={editor?.isActive("bold") ? "primary" : "default"}
                    size="small"
                  >
                    <FormatBold sx={{ fontSize: 14 }} />
                  </CompactIconButton>
                </Tooltip>

                <Tooltip title="Italic (Ctrl+I)">
                  <CompactIconButton
                    onClick={() => editor?.chain().focus().toggleItalic().run()}
                    color={editor?.isActive("italic") ? "primary" : "default"}
                    size="small"
                  >
                    <FormatItalic sx={{ fontSize: 14 }} />
                  </CompactIconButton>
                </Tooltip>

                <CompactDivider orientation="vertical" flexItem />

                {/* Headings */}
                <Tooltip title="Heading 1">
                  <CompactIconButton
                    onClick={() =>
                      editor?.chain().focus().toggleHeading({ level: 1 }).run()
                    }
                    color={
                      editor?.isActive("heading", { level: 1 })
                        ? "primary"
                        : "default"
                    }
                    size="small"
                  >
                    <Typography
                      variant="caption"
                      fontWeight="bold"
                      fontSize="0.5rem"
                    >
                      H1
                    </Typography>
                  </CompactIconButton>
                </Tooltip>

                <Tooltip title="Heading 2">
                  <CompactIconButton
                    onClick={() =>
                      editor?.chain().focus().toggleHeading({ level: 2 }).run()
                    }
                    color={
                      editor?.isActive("heading", { level: 2 })
                        ? "primary"
                        : "default"
                    }
                    size="small"
                  >
                    <Typography
                      variant="caption"
                      fontWeight="bold"
                      fontSize="0.5rem"
                    >
                      H2
                    </Typography>
                  </CompactIconButton>
                </Tooltip>

                <Tooltip title="Heading 3">
                  <CompactIconButton
                    onClick={() =>
                      editor?.chain().focus().toggleHeading({ level: 3 }).run()
                    }
                    color={
                      editor?.isActive("heading", { level: 3 })
                        ? "primary"
                        : "default"
                    }
                    size="small"
                  >
                    <Typography
                      variant="caption"
                      fontWeight="bold"
                      fontSize="0.5rem"
                    >
                      H3
                    </Typography>
                  </CompactIconButton>
                </Tooltip>

                <Tooltip title="Normal Text">
                  <CompactIconButton
                    onClick={() =>
                      editor?.chain().focus().setParagraph().run()
                    }
                    color={
                      editor?.isActive("paragraph") ? "primary" : "default"
                    }
                    size="small"
                  >
                    <Typography
                      variant="caption"
                      fontWeight="bold"
                      fontSize="0.5rem"
                    >
                      ¶
                    </Typography>
                  </CompactIconButton>
                </Tooltip>

                <CompactDivider orientation="vertical" flexItem />

                {/* Lists */}
                <Tooltip title="Bullet List">
                  <CompactIconButton
                    onClick={() =>
                      editor?.chain().focus().toggleBulletList().run()
                    }
                    color={
                      editor?.isActive("bulletList") ? "primary" : "default"
                    }
                    size="small"
                  >
                    <FormatListBulleted sx={{ fontSize: 14 }} />
                  </CompactIconButton>
                </Tooltip>

                <Tooltip title="Numbered List">
                  <CompactIconButton
                    onClick={() =>
                      editor?.chain().focus().toggleOrderedList().run()
                    }
                    color={
                      editor?.isActive("orderedList") ? "primary" : "default"
                    }
                    size="small"
                  >
                    <FormatListNumbered sx={{ fontSize: 14 }} />
                  </CompactIconButton>
                </Tooltip>
              </FormattingContainer>
            </FormattingToolbar>
          </StyledFormattingAppBar>
        </FormattingToolbarWrapper>
      </FormattingToolbarContainer>

    </>
  );
}
