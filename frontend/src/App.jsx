import { useEffect, useMemo, useState } from "react";
import {
  AppBar,
  Box,
  Button,
  Container,
  CssBaseline,
  IconButton,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
  Paper,
  Grow,
} from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import DarkModeRoundedIcon from "@mui/icons-material/DarkModeRounded";
import LightModeRoundedIcon from "@mui/icons-material/LightModeRounded";
import { keyframes } from "@mui/system";
import AdminView from "./pages/AdminView";
import ProjectManagerView from "./pages/ProjectManagerView";
import EngineerView from "./pages/EngineerView";
import ClientView from "./pages/ClientView";
import LoginView from "./pages/LoginView";
import { clearSession, getSession, safeGet } from "./api/client";
import { buildTheme } from "./theme.js";

const glow = keyframes`
  0% { transform: translateY(0px); opacity: 0.55; }
  50% { transform: translateY(-12px); opacity: 0.9; }
  100% { transform: translateY(0px); opacity: 0.55; }
`;

export default function App() {
  const [session, setSession] = useState(getSession());
  const [themeMode, setThemeMode] = useState(localStorage.getItem("inka_theme_mode") || "light");
  const [installPromptEvent, setInstallPromptEvent] = useState(null);
  const [masterData, setMasterData] = useState({
    categories: [],
    productTypes: [],
    brands: [],
    items: [],
  });

  useEffect(() => {
    if (!session) return;
    Promise.all([
      safeGet("/reference/categories", []),
      safeGet("/reference/product-types", []),
      safeGet("/reference/brands", []),
      safeGet("/reference/items", []),
    ]).then(([categories, productTypes, brands, items]) => {
      setMasterData({ categories, productTypes, brands, items });
    });
  }, [session]);

  useEffect(() => {
    function handleBeforeInstallPrompt(e) {
      e.preventDefault();
      setInstallPromptEvent(e);
    }
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  const roleView = session?.user?.role;
  const theme = useMemo(() => buildTheme(themeMode), [themeMode]);
  const isDark = themeMode === "dark";

  const roleLabel = useMemo(
    () =>
      ({
        admin: "Admin Web App",
        project_manager: "Project Manager Web App",
        engineer: "Engineer Mobile App",
        client: "Client Portal",
      })[roleView] || "INKA",
    [roleView]
  );

  if (!session) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <LoginView onLogin={setSession} />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: "100vh", position: "relative", overflow: "hidden" }}>
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            background: isDark
              ? "linear-gradient(135deg, #020617 0%, #0b1220 48%, #1f2937 100%)"
              : "linear-gradient(135deg, #e6fffb 0%, #f8fafc 42%, #fff6ed 100%)",
          }}
        />
        <Box
          sx={{
            position: "absolute",
            width: 320,
            height: 320,
            borderRadius: "50%",
            background: isDark
              ? "radial-gradient(circle, rgba(45,212,191,.26), transparent 68%)"
              : "radial-gradient(circle, rgba(20,184,166,.28), transparent 68%)",
            top: -60,
            right: -50,
            animation: `${glow} 6s ease-in-out infinite`,
            pointerEvents: "none",
          }}
        />

        <AppBar position="sticky" color="transparent" elevation={0}>
          <Toolbar
            sx={{
              backdropFilter: "blur(10px)",
              borderBottom: isDark ? "1px solid rgba(148,163,184,0.25)" : "1px solid #dbeafe",
              py: { xs: 0.8, sm: 0.2 },
              alignItems: { xs: "flex-start", sm: "center" },
              flexWrap: "wrap",
              rowGap: 0.8,
            }}
          >
            <Typography
              variant="h6"
              sx={{ flexGrow: 1, pr: 1, lineHeight: 1.25, fontSize: { xs: "1rem", sm: "1.15rem" } }}
            >
              INKA Project Management System
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ ml: { xs: 0, sm: "auto" }, flexWrap: "wrap" }}>
              <Typography variant="body2">{session.user.name} ({session.user.role})</Typography>
              <Tooltip title={isDark ? "Switch to light mode" : "Switch to dark mode"}>
                <IconButton
                  size="small"
                  onClick={() => {
                    const next = isDark ? "light" : "dark";
                    setThemeMode(next);
                    localStorage.setItem("inka_theme_mode", next);
                  }}
                >
                  {isDark ? <LightModeRoundedIcon /> : <DarkModeRoundedIcon />}
                </IconButton>
              </Tooltip>
              {installPromptEvent ? (
                <Button
                  variant="contained"
                  size="small"
                  onClick={async () => {
                    installPromptEvent.prompt();
                    await installPromptEvent.userChoice;
                    setInstallPromptEvent(null);
                  }}
                >
                  Install App
                </Button>
              ) : null}
              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  clearSession();
                  setSession(null);
                }}
              >
                Logout
              </Button>
            </Stack>
          </Toolbar>
        </AppBar>

        <Container maxWidth="xl" sx={{ py: 2.4, position: "relative" }}>
          <Grow in timeout={420}>
            <Paper
              sx={{
                p: 2.2,
                mb: 2,
                bgcolor: isDark ? "rgba(17,24,39,0.72)" : "rgba(255,255,255,0.72)",
                backdropFilter: "blur(8px)",
              }}
            >
              <Typography variant="overline" color="primary" sx={{ letterSpacing: "0.12em" }}>Unified Product Blueprint</Typography>
              <Typography variant="h4" sx={{ fontSize: { xs: 25, md: 33 } }}>{roleLabel}</Typography>
              <Typography variant="body2" color="text.secondary">
                Single Live BOM. Structured Scope Governance. Change-by-approval only.
              </Typography>
            </Paper>
          </Grow>

          {roleView === "admin" && <AdminView />}
          {roleView === "project_manager" && (
            <ProjectManagerView masterData={masterData} role={roleView} />
          )}
          {roleView === "engineer" && <EngineerView />}
          {roleView === "client" && <ClientView />}
        </Container>
      </Box>
    </ThemeProvider>
  );
}
