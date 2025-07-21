import {
  AppBar,
  Box,
  Button,
  Paper,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { Link } from "react-router-dom";
import scribeLogo from "../assets/scribe-logo.jpg";
import styles from "./Landing.module.css";

export default function Landing() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

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
          <Box display="flex" alignItems="center" gap={1}>
            <img
              src={scribeLogo}
              alt="Scribe Logo"
              className={styles.headerLogo}
              style={{ background: "transparent", height: "50px" }}
            />
            <Typography variant="h5" fontWeight="bold" color="text.primary">
              Scribe
            </Typography>
          </Box>
          <Box>
            <Link
              to="/login"
              style={{
                marginRight: "16px",
                color: "black",
                textDecoration: "none",
                padding: "8px 12px",
                borderRadius: "4px",
                fontWeight: 575,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.04)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              Login
            </Link>
            <Link
              to="/signup"
              style={{
                color: "black",
                textDecoration: "none",
                padding: "8px 12px",
                borderRadius: "4px",
                fontWeight: 575,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.04)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              Sign up
            </Link>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Box className={styles.mainContent}>
        <Typography
          variant={isMobile ? "h4" : "h3"}
          fontWeight="900"
          align="center"
          gutterBottom
          sx={{
            fontFamily:
              "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            fontSize: isMobile ? "2.5rem" : "3.5rem",
            lineHeight: 1.1,
            color: "#1a1a1a",
            letterSpacing: "-0.02em",
          }}
        >
          The simplest way to create and edit your documents
        </Typography>
        <Typography
          variant="h6"
          color="text.secondary"
          align="center"
          sx={{
            mb: 4,
            maxWidth: 600,
            fontFamily:
              "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            fontWeight: 400,
            fontSize: "1.25rem",
            lineHeight: 1.5,
            color: "#666666",
          }}
        >
          Say goodbye to clunky editors. Meet Scribe — the intuitive text editor
          designed to help you focus on writing.
        </Typography>
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            mb: 5,
          }}
        >
          <Button
            href="/signup"
            variant="contained"
            color="primary"
            size="large"
            sx={{
              px: 6,
              py: 2,
              borderRadius: "12px",
              fontSize: "1rem",
              fontWeight: 500,
              textTransform: "none",
              border: "3px solid",
              borderColor: "rgba(0, 0, 0, 0.2)",
              fontFamily:
                "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            }}
          >
            Get Started
          </Button>
        </Box>

        {/* Screenshot/mockup */}
        <Paper elevation={3} className={styles.screenshotPaper}>
          <img
            src="/editor-screenshot.png"
            alt="Scribe text editor screenshot"
            className={styles.screenshotImg}
          />
        </Paper>
      </Box>
    </Box>
  );
}
