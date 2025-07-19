import { ThemeProvider, createTheme } from "@mui/material/styles";
import Landing from "./pages/Landing";

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
      <Landing />
    </ThemeProvider>
  );
}

export default App;
