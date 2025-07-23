import {
  Add as AddIcon,
  Description as DocumentIcon,
  ViewModule as GridIcon,
  ViewList as ListIcon,
  MoreVert as MoreIcon,
  Share as ShareIcon,
  Delete as DeleteIcon,
  Launch as OpenIcon,
} from "@mui/icons-material";
import {
  Alert,
  AppBar,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Fab,
  Grid,
  IconButton,
  List,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  ListItemIcon,
  Menu,
  MenuItem,
  Paper,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Toolbar,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient, type DocumentResponse } from "../lib/api";
import ShareDocumentModal from "../components/ShareDocumentModal";
import UserMenu from "../components/UserMenu";

type ViewMode = "grid" | "list";

export default function DashboardMUI() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<DocumentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    fullName?: string;
  } | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedDocument, setSelectedDocument] = useState<DocumentResponse | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchDocuments();
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

  const fetchDocuments = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      const response = await apiClient.getDocuments();

      if (response.error) {
        if (
          response.error.includes("401") ||
          response.error.includes("Unauthorized")
        ) {
          navigate("/login");
          return;
        }
        throw new Error(response.error);
      }

      if (response.data) {
        setDocuments(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch documents:', err);
      setMessage("Failed to load documents. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  };

  const createDocument = async () => {
    if (!newDocTitle.trim()) return;

    setCreating(true);
    try {
      const response = await apiClient.createDocument({
        title: newDocTitle.trim(),
        content: "",
      });

      if (response.error) {
        throw new Error(response.error);
      }

      if (response.data) {
        setDocuments((prev) => [response.data!, ...prev]);
        setShowCreateModal(false);
        setNewDocTitle("");

        navigate(`/documents/${response.data.id}`);
      }
    } catch (err) {
      console.error('Failed to create document:', err);
      setMessage("Failed to create document. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return (
      date.toLocaleDateString() +
      " " +
      date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    );
  };


  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, doc: DocumentResponse) => {
    console.log('Menu clicked for document:', doc.title, doc.id);
    setAnchorEl(event.currentTarget);
    setSelectedDocument(doc);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleMenuCloseAndClear = () => {
    setAnchorEl(null);
    setSelectedDocument(null);
  };

  const handleOpenDocument = () => {
    if (selectedDocument) {
      navigate(`/documents/${selectedDocument.id}`);
    }
    handleMenuCloseAndClear();
  };

  const handleShareDocument = () => {
    handleMenuClose();
    setTimeout(() => {
      setShowShareModal(true);
    }, 100);
  };

  const handleDeleteDocument = () => {
    console.log('handleDeleteDocument called, selectedDocument:', selectedDocument);
    handleMenuClose();
    setShowDeleteConfirm(true);
  };

  const confirmDeleteDocument = async () => {
    console.log('Delete button clicked, selectedDocument:', selectedDocument);
    
    if (!selectedDocument) {
      console.log('No selected document, returning');
      return;
    }

    setDeleting(true);
    console.log('Starting delete process for document:', selectedDocument.id);
    
    try {
      const response = await apiClient.deleteDocument(selectedDocument.id);
      console.log('Delete API response:', response);

      if (response.error) {
        console.error('API returned error:', response.error);
        throw new Error(response.error);
      }

      console.log('Delete successful, updating document list');
      setDocuments((prev) => prev.filter((doc) => doc.id !== selectedDocument.id));
      setMessage("Document has been deleted successfully.");
      setShowDeleteConfirm(false);
      setSelectedDocument(null);
    } catch (err) {
      console.error('Failed to delete document:', err);
      setMessage("Failed to delete document. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <Box textAlign="center">
          <CircularProgress size={40} sx={{ mb: 2 }} />
          <Typography variant="body1" color="text.secondary">
            Loading documents...
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "grey.50" }}>
      {/* Header */}
      <AppBar position="static" color="inherit" elevation={1}>
        <Toolbar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography
              variant="h4"
              component="h1"
              sx={{ fontWeight: "bold", color: "text.primary" }}
            >
              Documents
            </Typography>
            {currentUser && (
              <Typography variant="body2" color="text.secondary">
                Welcome back,{" "}
                {currentUser.fullName ||
                  `${currentUser.firstName} ${currentUser.lastName}` ||
                  currentUser.email}
              </Typography>
            )}
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            {/* View Toggle */}
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(_, newView) => newView && setViewMode(newView)}
              size="small"
            >
              <ToggleButton value="grid">
                <GridIcon />
              </ToggleButton>
              <ToggleButton value="list">
                <ListIcon />
              </ToggleButton>
            </ToggleButtonGroup>

            <UserMenu user={currentUser} variant="button" />
          </Box>
        </Toolbar>
      </AppBar>

      {/* Content */}
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {message && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            {message}
          </Alert>
        )}

        {/* Grid View */}
        {viewMode === "grid" && (
          <Grid container spacing={3}>
            {/* Create New Document Card */}
            <Grid item xs={12} sm={6} md={4} lg={3}>
              <Card
                sx={{
                  height: 200,
                  border: "2px dashed",
                  borderColor: "grey.300",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  "&:hover": {
                    borderColor: "primary.main",
                    transform: "translateY(-2px)",
                    boxShadow: 3,
                  },
                }}
                onClick={() => setShowCreateModal(true)}
              >
                <CardContent
                  sx={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Avatar
                    sx={{
                      bgcolor: "primary.light",
                      mb: 2,
                      width: 56,
                      height: 56,
                    }}
                  >
                    <AddIcon />
                  </Avatar>
                  <Typography variant="h6" gutterBottom align="center">
                    Create New Document
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    align="center"
                  >
                    Start writing your next document
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Document Cards */}
            {documents.map((doc) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={doc.id}>
                <Card
                  sx={{
                    height: 200,
                    cursor: "pointer",
                    transition: "all 0.2s",
                    "&:hover": {
                      transform: "translateY(-2px)",
                      boxShadow: 4,
                    },
                  }}
                  onClick={() => navigate(`/documents/${doc.id}`)}
                >
                  <CardContent
                    sx={{
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                      <Avatar sx={{ bgcolor: "primary.light", mr: 2 }}>
                        <DocumentIcon />
                      </Avatar>
                      <Box sx={{ flexGrow: 1 }}>
                        {doc.isShared && (
                          <Chip
                            size="small"
                            label="Shared"
                            color="primary"
                            variant="outlined"
                            icon={<ShareIcon />}
                          />
                        )}
                      </Box>
                      <IconButton 
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMenuClick(e, doc);
                        }}
                      >
                        <MoreIcon />
                      </IconButton>
                    </Box>

                    <Typography
                      variant="h6"
                      component="h3"
                      sx={{ mb: 1, flexGrow: 1 }}
                      noWrap
                    >
                      {doc.title}
                    </Typography>

                    <Box>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        display="block"
                      >
                        Updated {formatDate(doc.updatedAt)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        By{" "}
                        {doc.authorId === currentUser?.id
                          ? "You"
                          : doc.author?.email || doc.authorId}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* List View */}
        {viewMode === "list" && (
          <Paper elevation={1}>
            <List>
              {/* Create New Item */}
              <ListItemButton
                onClick={() => setShowCreateModal(true)}
                sx={{ borderBottom: 1, borderColor: "divider" }}
              >
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: "primary.light" }}>
                    <AddIcon />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Typography color="primary" fontWeight="medium">
                      Create New Document
                    </Typography>
                  }
                  secondary="Start writing your next document"
                />
              </ListItemButton>

              {/* Document Items */}
              {documents.map((doc) => (
                <ListItemButton
                  key={doc.id}
                  onClick={() => navigate(`/documents/${doc.id}`)}
                  sx={{ borderBottom: 1, borderColor: "divider" }}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: "primary.light" }}>
                      <DocumentIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={doc.title}
                    secondary={
                      <Box>
                        <Typography variant="caption" display="block">
                          Updated {formatDate(doc.updatedAt)}
                        </Typography>
                        <Typography variant="caption">
                          By{" "}
                          {doc.authorId === currentUser?.id
                            ? "You"
                            : doc.author?.email || doc.authorId}
                        </Typography>
                      </Box>
                    }
                  />
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    {doc.isShared && (
                      <Chip
                        size="small"
                        label="Shared"
                        color="primary"
                        variant="outlined"
                      />
                    )}
                    <IconButton 
                      edge="end"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMenuClick(e, doc);
                      }}
                    >
                      <MoreIcon />
                    </IconButton>
                  </Box>
                </ListItemButton>
              ))}
            </List>
          </Paper>
        )}

        {/* Empty State */}
        {documents.length === 0 && !loading && (
          <Box textAlign="center" py={8}>
            <Avatar
              sx={{
                bgcolor: "grey.100",
                width: 80,
                height: 80,
                mx: "auto",
                mb: 3,
              }}
            >
              <DocumentIcon sx={{ fontSize: 40, color: "grey.400" }} />
            </Avatar>
            <Typography variant="h5" gutterBottom>
              No documents yet
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ mb: 3, maxWidth: "sm", mx: "auto" }}
            >
              Get started by creating your first document. You can write,
              collaborate, and share with others in real-time.
            </Typography>
            <Button
              variant="contained"
              size="large"
              startIcon={<AddIcon />}
              onClick={() => setShowCreateModal(true)}
            >
              Create Your First Document
            </Button>
          </Box>
        )}
      </Container>

      {/* Floating Action Button for Mobile */}
      <Fab
        color="primary"
        sx={{
          position: "fixed",
          bottom: 16,
          right: 16,
          display: { xs: "flex", md: "none" },
        }}
        onClick={() => setShowCreateModal(true)}
      >
        <AddIcon />
      </Fab>

      {/* Create Document Modal */}
      <Dialog
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create New Document</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Document Title"
            fullWidth
            variant="outlined"
            value={newDocTitle}
            onChange={(e) => setNewDocTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && createDocument()}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setShowCreateModal(false);
              setNewDocTitle("");
            }}
            disabled={creating}
          >
            Cancel
          </Button>
          <Button
            onClick={createDocument}
            variant="contained"
            disabled={!newDocTitle.trim() || creating}
            startIcon={creating ? <CircularProgress size={16} /> : undefined}
          >
            {creating ? "Creating..." : "Create"}
          </Button>
        </DialogActions>
      </Dialog>


      {/* Document Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuCloseAndClear}
      >
        <MenuItem onClick={handleOpenDocument}>
          <ListItemIcon>
            <OpenIcon fontSize="small" />
          </ListItemIcon>
          Open Document
        </MenuItem>
        <MenuItem onClick={handleShareDocument}>
          <ListItemIcon>
            <ShareIcon fontSize="small" />
          </ListItemIcon>
          Share Document
        </MenuItem>
        <MenuItem 
          onClick={(e) => {
            e.stopPropagation();
            handleDeleteDocument();
          }} 
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon>
            <DeleteIcon fontSize="small" sx={{ color: 'error.main' }} />
          </ListItemIcon>
          Delete Document
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={showDeleteConfirm}
        onClose={() => {
          if (!deleting) {
            setShowDeleteConfirm(false);
            setSelectedDocument(null);
          }
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ color: 'error.main' }}>Delete Document</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this file? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setShowDeleteConfirm(false);
              setSelectedDocument(null);
            }}
            disabled={deleting}
          >
            Cancel
          </Button>
          <Button
            onClick={confirmDeleteDocument}
            variant="contained"
            color="error"
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={16} /> : <DeleteIcon />}
          >
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Share Document Modal */}
      {selectedDocument && (
        <ShareDocumentModal
          isOpen={showShareModal}
          onClose={() => {
            setShowShareModal(false);
            setSelectedDocument(null);
          }}
          documentId={selectedDocument.id}
          documentTitle={selectedDocument.title}
        />
      )}
    </Box>
  );
}
