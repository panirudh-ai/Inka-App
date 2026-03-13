import { useEffect, useMemo, useState } from "react";
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Chip,
  Container,
  CssBaseline,
  Divider,
  IconButton,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import { ThemeProvider, alpha } from "@mui/material/styles";
import DarkModeRoundedIcon from "@mui/icons-material/DarkModeRounded";
import LightModeRoundedIcon from "@mui/icons-material/LightModeRounded";
import AdminView from "./pages/AdminView";
import ProjectManagerView from "./pages/ProjectManagerView";
import EngineerView from "./pages/EngineerView";
import ClientView from "./pages/ClientView";
import LoginView from "./pages/LoginView";
import { clearSession, getSession, safeGet } from "./api/client";
import { buildTheme } from "./theme.js";

// Role metadata
const ROLE_META = {
  admin:           { label: "Admin",           badge: "Admin",   color: "#635BFF" },
  project_manager: { label: "Project Manager", badge: "PM",      color: "#0073E6" },
  engineer:        { label: "Engineer",         badge: "Eng",     color: "#1A9E5D" },
  client:          { label: "Client Portal",    badge: "Client",  color: "#B7791F" },
};

function initials(name = "") {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "?";
}

export default function App() {
  const [session, setSession]     = useState(getSession());
  const [themeMode, setThemeMode] = useState(localStorage.getItem("inka_theme_mode") || "light");
  const [installPromptEvent, setInstallPromptEvent] = useState(null);
  const [masterData, setMasterData] = useState({ categories: [], productTypes: [], brands: [], items: [] });

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
    function handle(e) { e.preventDefault(); setInstallPromptEvent(e); }
    window.addEventListener("beforeinstallprompt", handle);
    return () => window.removeEventListener("beforeinstallprompt", handle);
  }, []);

  const theme   = useMemo(() => buildTheme(themeMode), [themeMode]);
  const isDark  = themeMode === "dark";
  const roleView = session?.user?.role;
  const meta     = ROLE_META[roleView] || { label: "INKA", badge: "?", color: "#635BFF" };

  const toggleTheme = () => {
    const next = isDark ? "light" : "dark";
    setThemeMode(next);
    localStorage.setItem("inka_theme_mode", next);
  };

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
      <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>

        {/* ── Top Navigation Bar ─────────────────────────────────────── */}
        <AppBar position="sticky">
          <Toolbar
            sx={{
              minHeight: { xs: 52, sm: 56 },
              px: { xs: 2, sm: 3 },
              gap: 1.5,
            }}
          >
            {/* Wordmark */}
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mr: 2 }}>
              <Box
                sx={{
                  width: 28,
                  height: 28,
                  borderRadius: "7px",
                  background: "linear-gradient(135deg, #7B73FF 0%, #635BFF 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: 13, lineHeight: 1 }}>I</Typography>
              </Box>
              <Typography
                sx={{
                  fontWeight: 700,
                  fontSize: { xs: "0.95rem", sm: "1rem" },
                  color: isDark ? "#E2E8F0" : "#0A2540",
                  letterSpacing: "-0.01em",
                }}
              >
                INKA
              </Typography>
            </Stack>

            {/* Role badge */}
            <Chip
              label={meta.label}
              size="small"
              sx={{
                bgcolor: alpha(meta.color, isDark ? 0.2 : 0.08),
                color: meta.color,
                fontWeight: 600,
                fontSize: "0.75rem",
                height: 22,
                borderRadius: "4px",
                border: `1px solid ${alpha(meta.color, 0.25)}`,
              }}
            />

            <Box sx={{ flexGrow: 1 }} />

            {/* Right actions */}
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <Tooltip title={isDark ? "Light mode" : "Dark mode"}>
                <IconButton size="small" onClick={toggleTheme} sx={{ color: "text.secondary" }}>
                  {isDark ? <LightModeRoundedIcon sx={{ fontSize: 18 }} /> : <DarkModeRoundedIcon sx={{ fontSize: 18 }} />}
                </IconButton>
              </Tooltip>

              {installPromptEvent && (
                <Button
                  variant="outlined"
                  size="small"
                  onClick={async () => {
                    installPromptEvent.prompt();
                    await installPromptEvent.userChoice;
                    setInstallPromptEvent(null);
                  }}
                >
                  Install
                </Button>
              )}

              <Divider orientation="vertical" flexItem sx={{ mx: 0.5, height: 20, alignSelf: "center" }} />

              {/* User avatar */}
              <Stack direction="row" alignItems="center" spacing={1}>
                <Avatar
                  sx={{
                    width: 28,
                    height: 28,
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    bgcolor: alpha(meta.color, 0.15),
                    color: meta.color,
                    border: `1.5px solid ${alpha(meta.color, 0.3)}`,
                  }}
                >
                  {initials(session.user.name)}
                </Avatar>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 500,
                    color: "text.primary",
                    display: { xs: "none", sm: "block" },
                    maxWidth: 140,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {session.user.name}
                </Typography>
              </Stack>

              <Button
                variant="outlined"
                size="small"
                onClick={() => { clearSession(); setSession(null); }}
                sx={{ ml: 0.5 }}
              >
                Sign out
              </Button>
            </Stack>
          </Toolbar>
        </AppBar>

        {/* ── Page content ───────────────────────────────────────────── */}
        <Container
          maxWidth="xl"
          sx={{ py: { xs: 2.5, sm: 3.5 }, px: { xs: 2, sm: 3 } }}
        >
          {roleView === "admin"           && <AdminView />}
          {roleView === "project_manager" && <ProjectManagerView masterData={masterData} role={roleView} />}
          {roleView === "engineer"        && <EngineerView />}
          {roleView === "client"          && <ClientView />}
        </Container>
      </Box>
    </ThemeProvider>
  );
}
