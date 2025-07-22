import {
  Alert,
  AppBar,
  Box,
  Button,
  Link,
  Paper,
  TextField,
  Toolbar,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import scribeLogo from "../assets/scribe-logo.jpg";
import { apiClient } from "../lib/api";
import styles from "./Signup.module.css";

export default function Signup() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    if (password !== confirmPassword) {
      setMessage("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const response = await apiClient.register(email, password, firstName, lastName);

      if (response.error) {
        throw new Error(response.error);
      }

      if (response.data?.token) {
        localStorage.setItem("token", response.data.token);
        // Redirect to dashboard or home page
        window.location.href = "/dashboard";
      } else {
        throw new Error("No token received");
      }
    } catch (err) {
      console.error('Registration error:', err);
      setMessage("Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box className={styles.root}>
      {/* Header */}
      <AppBar
        position="static"
        color="inherit"
        elevation={0}
        sx={{ backgroundColor: "transparent" }}
      >
        <Toolbar sx={{ justifyContent: "space-between" }}>
          <Link
            component={RouterLink}
            to="/"
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              textDecoration: "none",
              color: "inherit",
              "&:hover": {
                textDecoration: "none",
              },
            }}
          >
            <img
              src={scribeLogo}
              alt="Scribe Logo"
              style={{ height: "50px", background: "transparent" }}
            />
            <Typography variant="h5" fontWeight="bold" color="text.primary">
              Scribe
            </Typography>
          </Link>
          <Box></Box>
        </Toolbar>
      </AppBar>

      <Box className={styles.container}>
        <Paper elevation={3} className={styles.formPaper}>
          {/* Title */}
          <Typography
            variant="h4"
            fontWeight="bold"
            align="center"
            gutterBottom
            sx={{ mb: 3 }}
          >
            Create your account
          </Typography>

          {/* Message Alert */}
          {message && (
            <Alert severity="warning" sx={{ mb: 3 }}>
              {message}
            </Alert>
          )}

          {/* Signup Form */}
          <Box component="form" onSubmit={handleSubmit}>
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <TextField
                label="First Name"
                variant="outlined"
                fullWidth
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
              <TextField
                label="Last Name"
                variant="outlined"
                fullWidth
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </Box>
            <TextField
              type="email"
              label="Email"
              variant="outlined"
              fullWidth
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              sx={{ mb: 3 }}
            />
            <TextField
              type="password"
              label="Password"
              variant="outlined"
              fullWidth
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              sx={{ mb: 3 }}
            />
            <TextField
              type="password"
              label="Confirm Password"
              variant="outlined"
              fullWidth
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              sx={{ mb: 4 }}
            />
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              size="large"
              disabled={loading}
              sx={{
                py: 1.5,
                borderRadius: "8px",
                fontSize: "1rem",
                fontWeight: 500,
                textTransform: "none",
                mb: 3,
              }}
            >
              {loading ? "Creating account..." : "Create account"}
            </Button>
          </Box>

          {/* Login link */}
          <Typography align="center" color="text.secondary">
            Already have an account?{" "}
            <Link
              component={RouterLink}
              to="/login"
              sx={{ color: "primary.main" }}
            >
              Login →
            </Link>
          </Typography>
        </Paper>
      </Box>
    </Box>
  );
}
