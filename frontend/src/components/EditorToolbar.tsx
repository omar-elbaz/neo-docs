import {
  AccountCircle,
  FormatBold,
  FormatItalic,
  FormatListBulleted,
  FormatListNumbered,
  History,
  Logout,
  Settings,
  Share,
} from "@mui/icons-material";
import {
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
  Typography,
} from "@mui/material";
import React from "react";
import { useNavigate } from "react-router-dom";
import type { EditorToolbarProps } from "../types/editor";
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
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setAnchorEl(null);
    navigate("/login");
  };

  const isMenuOpen = Boolean(anchorEl);

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
            {collaborators.size > 0 && (
              <CollaboratorContainer>
                {Array.from(collaborators.values())
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
                      title={collab.userId}
                    >
                      {collab.userId[0]?.toUpperCase()}
                    </Avatar>
                  ))}
                {collaborators.size > 3 && (
                  <Avatar
                    sx={{
                      width: 24,
                      height: 24,
                      fontSize: "0.6rem",
                      bgcolor: "grey.500",
                    }}
                  >
                    +{collaborators.size - 3}
                  </Avatar>
                )}
              </CollaboratorContainer>
            )}
            
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
            <Tooltip title="Account">
              <IconButton onClick={handleProfileMenuOpen} size="small">
                <Avatar sx={{ width: 24, height: 24 }}>
                  <AccountCircle sx={{ fontSize: 16 }} />
                </Avatar>
              </IconButton>
            </Tooltip>
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

      {/* User Menu */}
      <Menu
        anchorEl={anchorEl}
        open={isMenuOpen}
        onClose={handleMenuClose}
        onClick={handleMenuClose}
        slotProps={{
          paper: {
            elevation: 0,
            sx: {
              overflow: "visible",
              filter: "drop-shadow(0px 2px 8px rgba(0,0,0,0.32))",
              mt: 1.5,
              "& .MuiAvatar-root": {
                width: 24,
                height: 24,
                ml: -0.5,
                mr: 1,
              },
            },
          },
        }}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
      >
        <MenuItem onClick={handleMenuClose}>
          <Avatar />
          {userId}
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <Settings fontSize="small" sx={{ mr: 1 }} />
          Settings
        </MenuItem>
        <MenuItem onClick={handleLogout}>
          <Logout fontSize="small" sx={{ mr: 1 }} />
          Logout
        </MenuItem>
      </Menu>
    </>
  );
}
