import { ThemeProvider, createTheme } from "@mui/material/styles";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import DocumentEditor from "./pages/DocumentEditor";
import Dashboard from "./pages/DashboardMUI";
import AuthGuard from "./components/AuthGuard";

const theme = createTheme({
  palette: {
    text: {
      primary: "#000000",
      secondary: "#666666",
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <Router>
        <Routes>
          <Route 
            path="/" 
            element={
              <AuthGuard>
                <Landing />
              </AuthGuard>
            } 
          />
          <Route 
            path="/login" 
            element={
              <AuthGuard>
                <Login />
              </AuthGuard>
            } 
          />
          <Route 
            path="/signup" 
            element={
              <AuthGuard>
                <Signup />
              </AuthGuard>
            } 
          />
          <Route 
            path="/dashboard" 
            element={
              <AuthGuard requireAuth={true}>
                <Dashboard />
              </AuthGuard>
            } 
          />
          <Route 
            path="/documents/:id" 
            element={
              <AuthGuard requireAuth={true}>
                <DocumentEditor />
              </AuthGuard>
            } 
          />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
