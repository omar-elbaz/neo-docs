import {
  AppBar,
  Box,
  Divider,
  IconButton,
  styled,
  TextField,
  Toolbar,
  Typography,
} from "@mui/material";
import { EditorContent } from "@tiptap/react";

// App Header Styled Components (Full width, flush with background)
export const AppHeaderContainer = styled(Box)({
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  zIndex: 1000,
  backgroundColor: "#e8e8e8",
  padding: "8px 16px",
});

export const AppHeaderContent = styled(Box)({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  width: "100%",
});

export const LogoContainer = styled(Box)({
  display: "flex",
  alignItems: "center",
  marginRight: 16,
  cursor: "pointer",
});

export const ScribeLogo = styled(Box)({
  width: 32,
  height: 32,
  background: "linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)",
  borderRadius: 8,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "white",
  fontSize: "1rem",
  fontWeight: "bold",
  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
  transition: "all 0.2s ease",
  "&:hover": {
    transform: "scale(1.05)",
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.15)",
  },
});

// Formatting Toolbar Styled Components (Centered, compact)
export const FormattingToolbarContainer = styled(Box)({
  position: "fixed",
  top: 45, // Below the app header
  left: 0,
  right: 0,
  zIndex: 999,
  display: "flex",
  justifyContent: "center",
  padding: "10px 16px",
  backgroundColor: "#e8e8e8",
});

export const FormattingToolbarWrapper = styled(Box)({
  width: "99%",
});

export const StyledFormattingAppBar = styled(AppBar)({
  borderRadius: 8,
  overflow: "hidden",
  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
});

export const FormattingToolbar = styled(Toolbar)({
  minHeight: "34px !important",
  maxHeight: "34px !important",
  height: "34px !important",
  backgroundColor: "#edede9",
  paddingLeft: 8,
  paddingRight: 8,
  paddingTop: 0,
  paddingBottom: 0,
  "& .MuiToolbar-root": {
    minHeight: "32px !important",
    height: "32px !important",
  },
});

export const TitleContainer = styled(Box)({
  display: "flex",
  alignItems: "center",
  flex: 1,
  minWidth: 0,
});

export const StyledTextField = styled(TextField)({
  flex: 1,
  "& .MuiInput-underline:before": { display: "none" },
  "& .MuiInput-underline:after": { display: "none" },
  "& .MuiInputBase-input": {
    fontSize: "0.9rem",
    fontWeight: 500,
    color: "text.primary",
    paddingTop: 4,
    paddingBottom: 4,
    "&:hover": {
      backgroundColor: "rgba(0, 0, 0, 0.04)",
      borderRadius: 4,
    },
    "&:focus": {
      backgroundColor: "rgba(0, 0, 0, 0.04)",
      borderRadius: 4,
    },
  },
});

export const StatusContainer = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: 8,
  marginLeft: 16,
  marginRight: 16,
});

export const StatusDot = styled(Box)<{ isConnected: boolean }>(
  ({ isConnected }) => ({
    width: 6,
    height: 6,
    borderRadius: "50%",
    backgroundColor: isConnected ? "#4caf50" : "#f44336",
  })
);

export const StatusText = styled(Typography)({
  fontSize: "0.7rem",
  color: "text.secondary",
});

export const UserContainer = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: 4,
});

export const CollaboratorContainer = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: 4,
  marginRight: 8,
});

export const FormattingContainer = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: 2,
});

export const CompactIconButton = styled(IconButton)({
  padding: 4,
});

export const CompactDivider = styled(Divider)({
  marginLeft: 4,
  marginRight: 4,
  height: 16,
});

// Document Editor Styled Components
export const EditorContainer = styled(Box)({
  width: "100%",
  height: "100%",
  display: "flex",
  flexDirection: "column",
  backgroundColor: "#e8e8e8",
});

export const DocumentArea = styled(Box)({
  flex: 1,
  overflow: "auto",
  backgroundColor: "#e8e8e8",
  paddingTop: 80, // Space for app header + formatting toolbar + padding
  paddingBottom: 32,
});

export const DocumentWrapper = styled(Box)({
  display: "flex",
  justifyContent: "center",
  padding: "16px 16px 0 16px", // Add top padding between toolbar and document
});

export const DocumentContainer = styled(Box)({
  backgroundColor: "white",
  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
  border: "1px solid #d0d0d0",
  borderRadius: 0,
  width: "8.5in",
  minHeight: "11in",
  maxWidth: "calc(100vw - 2rem)",
  margin: "0 auto",
});

export const DocumentContent = styled(Box)({
  padding: "80px 80px 64px 80px",
});

export const StyledEditorContent = styled(EditorContent)({
  "&.scribe-editor": {
    outline: "none",
    minHeight: "9in",
    "& .ProseMirror": {
      outline: "none",
      fontSize: "12pt",
      lineHeight: 1.6,
      fontFamily: '"Times New Roman", serif',
    },
  },
});

// Page Styled Components
export const PageContainer = styled(Box)({
  height: "100vh",
  display: "flex",
  flexDirection: "column",
  backgroundColor: "#e8e8e8",
});

export const EditorWrapper = styled(Box)({
  flex: 1,
  overflow: "hidden",
  backgroundColor: "#e8e8e8",
});
