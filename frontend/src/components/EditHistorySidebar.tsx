import {
  Add,
  Close,
  Delete,
  Edit,
  FormatBold,
  History,
  List as ListIcon,
  Person,
  Title,
} from "@mui/icons-material";
import {
  Avatar,
  Box,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Paper,
  Tooltip,
  Typography,
} from "@mui/material";
import { formatDistanceToNow } from "date-fns";
import React, { useEffect, useState } from "react";

export interface ActivityData {
  id: string;
  documentId: string;
  userId: string;
  type: string;
  timestamp: string;
  description: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
  } | null;
}

interface EditHistorySidebarProps {
  documentId: string;
  isOpen: boolean;
  onClose: () => void;
}

const EditHistorySidebar: React.FC<EditHistorySidebarProps> = ({
  documentId,
  isOpen,
  onClose,
}) => {
  const [activities, setActivities] = useState<ActivityData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch activities from API
  const fetchActivities = async () => {
    if (!documentId) return;

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3001";
      const response = await fetch(
        `${apiUrl}/documents/${documentId}/activities`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch activities");
      }

      const data = await response.json();
      setActivities(data.activities || []);
    } catch (err) {
      console.error("Failed to fetch activities:", err);
      setError("Failed to load edit history");
    } finally {
      setLoading(false);
    }
  };

  // Fetch activities on mount and when document changes
  useEffect(() => {
    if (isOpen) {
      fetchActivities();
    }
  }, [documentId, isOpen]);

  // Listen for real-time activity updates via Socket.IO
  useEffect(() => {
    if (!isOpen || typeof window === "undefined") return;

    // Access socket from window if it exists (set up in DocumentEditor)
    const socket = (window as any).documentSocket;

    if (socket) {
      const handleActivity = (activity: any) => {
        // Add user display name
        const enrichedActivity: ActivityData = {
          ...activity,
          timestamp: new Date(activity.timestamp).toISOString(),
        };

        setActivities((prev) => [enrichedActivity, ...prev.slice(0, 99)]); // Keep last 100
      };

      socket.on("document-activity", handleActivity);

      return () => {
        socket.off("document-activity", handleActivity);
      };
    }
  }, [isOpen]);

  // Get icon for activity type
  const getActivityIcon = (type: string) => {
    switch (type) {
      case "text_inserted":
        return <Add fontSize="small" />;
      case "text_added":
        return <Edit fontSize="small" />;
      case "text_deleted":
        return <Delete fontSize="small" />;
      case "text_formatted":
        return <FormatBold fontSize="small" />;
      case "heading_added":
        return <Title fontSize="small" />;
      case "list_created":
        return <ListIcon fontSize="small" />;
      case "user_joined":
        return <Person fontSize="small" color="success" />;
      case "user_left":
        return <Person fontSize="small" color="error" />;
      default:
        return <Edit fontSize="small" />;
    }
  };

  // Get color for activity type
  const getActivityColor = (type: string) => {
    switch (type) {
      case "text_inserted":
        return "success";
      case "text_deleted":
        return "error";
      case "text_formatted":
        return "info";
      case "user_joined":
        return "success";
      case "user_left":
        return "warning";
      default:
        return "default";
    }
  };

  // Get user display name
  const getUserDisplayName = (user: ActivityData["user"]) => {
    if (!user) return "Unknownh User";
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.email.split("@")[0];
  };

  // Get user avatar
  const getUserAvatar = (user: ActivityData["user"]) => {
    if (!user) return "U";
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`;
    }
    return user.email[0].toUpperCase();
  };

  if (!isOpen) return null;

  return (
    <Paper
      elevation={3}
      sx={{
        position: "fixed",
        top: 0,
        right: 0,
        width: 350,
        height: "100vh",
        zIndex: 1300,
        display: "flex",
        flexDirection: "column",
        backgroundColor: "background.paper",
      }}
    >
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <History />
            <Typography variant="h6">Edit History</Typography>
          </Box>
          <Tooltip title="Close">
            <IconButton onClick={onClose} size="small">
              <Close />
            </IconButton>
          </Tooltip>
        </Box>
        <Typography variant="body2" color="text.secondary">
          Live changes during this session
        </Typography>
      </Box>

      {/* Content */}
      <Box sx={{ flex: 1, overflow: "auto" }}>
        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Box sx={{ p: 2 }}>
            <Typography color="error" variant="body2">
              {error}
            </Typography>
          </Box>
        )}

        {!loading && !error && activities.length === 0 && (
          <Box sx={{ p: 3, textAlign: "center" }}>
            <History sx={{ fontSize: 48, color: "text.disabled", mb: 2 }} />
            <Typography variant="body2" color="text.secondary">
              No activity yet. Start editing to see live changes appear here.
            </Typography>
          </Box>
        )}

        {!loading && activities.length > 0 && (
          <List sx={{ p: 0 }}>
            {activities.map((activity, index) => (
              <React.Fragment key={activity.id}>
                <ListItem
                  sx={{
                    py: 1.5,
                    px: 2,
                    "&:hover": {
                      backgroundColor: "action.hover",
                    },
                  }}
                >
                  <ListItemAvatar>
                    <Avatar
                      sx={{
                        width: 32,
                        height: 32,
                        fontSize: "0.75rem",
                        bgcolor: "primary.main",
                      }}
                    >
                      {getUserAvatar(activity.user)}
                    </Avatar>
                  </ListItemAvatar>

                  <ListItemText
                    primary={
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          mb: 0.5,
                        }}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {getUserDisplayName(activity.user)}
                        </Typography>
                        <Chip
                          icon={getActivityIcon(activity.type)}
                          label={activity.type.replace("_", " ")}
                          size="small"
                          color={getActivityColor(activity.type) as any}
                          sx={{
                            height: 20,
                            fontSize: "0.625rem",
                            "& .MuiChip-icon": {
                              fontSize: "0.75rem",
                            },
                          }}
                        />
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography
                          variant="body2"
                          color="text.primary"
                          sx={{ mb: 0.5 }}
                        >
                          {activity.description}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ fontSize: "0.625rem" }}
                        >
                          {formatDistanceToNow(new Date(activity.timestamp), {
                            addSuffix: true,
                          })}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
                {index < activities.length - 1 && (
                  <Divider variant="inset" component="li" />
                )}
              </React.Fragment>
            ))}
          </List>
        )}
      </Box>

      {/* Footer */}
      <Box sx={{ p: 1.5, borderTop: 1, borderColor: "divider" }}>
        <Typography
          variant="caption"
          color="text.secondary"
          align="center"
          display="block"
        >
          Showing activities from this session
        </Typography>
      </Box>
    </Paper>
  );
};

export default EditHistorySidebar;
