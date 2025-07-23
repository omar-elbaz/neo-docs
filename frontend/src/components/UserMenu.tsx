import {
  Person as PersonIcon,
  ExitToApp as LogoutIcon,
} from "@mui/icons-material";
import {
  Avatar,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  ListItemIcon,
  Menu,
  MenuItem,
  Paper,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
}

interface UserMenuProps {
  user: User | null;
  variant?: "button" | "avatar";
  size?: "small" | "medium";
  anchorEl?: HTMLElement | null;
  open?: boolean;
  onClose?: () => void;
  onMenuOpen?: (event: React.MouseEvent<HTMLElement>) => void;
}

export default function UserMenu({
  user,
  variant = "button",
  size = "medium",
  anchorEl,
  open,
  onClose,
  onMenuOpen,
}: UserMenuProps) {
  const navigate = useNavigate();
  const [internalAnchorEl, setInternalAnchorEl] = useState<null | HTMLElement>(null);
  const [showUserModal, setShowUserModal] = useState(false);

  // Use external state if provided, otherwise use internal state
  const menuAnchorEl = anchorEl !== undefined ? anchorEl : internalAnchorEl;
  const isMenuOpen = open !== undefined ? open : Boolean(internalAnchorEl);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    if (onMenuOpen) {
      onMenuOpen(event);
    } else {
      setInternalAnchorEl(event.currentTarget);
    }
  };

  const handleMenuClose = () => {
    if (onClose) {
      onClose();
    } else {
      setInternalAnchorEl(null);
    }
  };

  const handleProfileClick = () => {
    handleMenuClose();
    setShowUserModal(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    handleMenuClose();
    navigate("/login");
  };

  const getUserDisplayName = () => {
    if (!user) return "User";
    return (
      user.fullName ||
      `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
      user.email?.split("@")[0] ||
      "User"
    );
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

  const renderTrigger = () => {
    if (variant === "avatar") {
      return (
        <IconButton onClick={handleMenuOpen} size={size}>
          <Avatar sx={{ width: size === "small" ? 24 : 32, height: size === "small" ? 24 : 32 }}>
            <PersonIcon sx={{ fontSize: size === "small" ? 16 : 20 }} />
          </Avatar>
        </IconButton>
      );
    }

    return (
      <Button
        onClick={handleMenuOpen}
        sx={{
          bgcolor: "grey.200",
          "&:hover": { bgcolor: "grey.300" },
          color: "grey.700",
          textTransform: "none",
          px: 2,
          py: 1,
          borderRadius: 2,
        }}
        startIcon={<PersonIcon />}
      >
        {getUserDisplayName()}
      </Button>
    );
  };

  return (
    <>
      {renderTrigger()}

      {/* User Menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={isMenuOpen}
        onClose={handleMenuClose}
        sx={{ mt: 1 }}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
      >
        <MenuItem onClick={handleProfileClick}>
          <ListItemIcon>
            <PersonIcon fontSize="small" />
          </ListItemIcon>
          Profile
        </MenuItem>
        <MenuItem onClick={handleLogout} sx={{ color: "error.main" }}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" sx={{ color: "error.main" }} />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>

      {/* User Profile Modal */}
      <Dialog
        open={showUserModal}
        onClose={() => setShowUserModal(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar sx={{ bgcolor: "primary.main" }}>
              <PersonIcon />
            </Avatar>
            <Box>
              <Typography variant="h6">
                {user?.fullName ||
                  `${user?.firstName || ""} ${user?.lastName || ""}`.trim() ||
                  "User"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {user?.email}
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  gutterBottom
                >
                  Email
                </Typography>
                <Paper variant="outlined" sx={{ p: 2, bgcolor: "grey.50" }}>
                  <Typography variant="body2">{user?.email}</Typography>
                </Paper>
              </Grid>

              <Grid item xs={6}>
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  gutterBottom
                >
                  First Name
                </Typography>
                <Paper variant="outlined" sx={{ p: 2, bgcolor: "grey.50" }}>
                  <Typography variant="body2">
                    {user?.firstName || "Not set"}
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={6}>
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  gutterBottom
                >
                  Last Name
                </Typography>
                <Paper variant="outlined" sx={{ p: 2, bgcolor: "grey.50" }}>
                  <Typography variant="body2">
                    {user?.lastName || "Not set"}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setShowUserModal(false)} color="inherit">
            Close
          </Button>
          <Button
            onClick={handleLogout}
            variant="contained"
            color="error"
            startIcon={<LogoutIcon />}
          >
            Logout
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}