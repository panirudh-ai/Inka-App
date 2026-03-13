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
  Fade,
  IconButton,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import { ThemeProvider, alpha } from "@mui/material/styles";
import DarkModeRoundedIcon   from "@mui/icons-material/DarkModeRounded";
import LightModeRoundedIcon  from "@mui/icons-material/LightModeRounded";
import AdminView             from "./pages/AdminView";
import ProjectManagerView    from "./pages/ProjectManagerView";
import EngineerView          from "./pages/EngineerView";
import ClientView            from "./pages/ClientView";
import LoginView             from "./pages/LoginView";
import AnimatedBackground    from "./components/AnimatedBackground";
import { clearSession, getSession, safeGet } from "./api/client";
import { buildTheme, G8 } from "./theme.js";

const ROLE_META = {
  admin:           { label: "Admin",           color: G8.orange  },
  project_manager: { label: "Project Manager", color: "#60a5fa"  },
  engineer:        { label: "Engineer",         color: "#4ade80"  },
  client:          { label: "Client Portal",    color: "#fbbf24"  },
};

function initials(name = "") {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "?";
}

export default function App() {
  const [session,   setSession]   = useState(getSession());
  const [themeMode, setThemeMode] = useState(localStorage.getItem("inka_theme_mode") || "dark");
  const [installPromptEvent, setInstallPromptEvent] = useState(null);
  const [masterData, setMasterData] = useState({ categories: [], productTypes: [], brands: [], items: [] });

  useEffect(() => {
    if (!session) return;
    Promise.all([
      safeGet("/reference/categories",    []),
      safeGet("/reference/product-types", []),
      safeGet("/reference/brands",        []),
      safeGet("/reference/items",         []),
    ]).then(([categories, productTypes, brands, items]) =>
      setMasterData({ categories, productTypes, brands, items })
    );
  }, [session]);

  useEffect(() => {
    function handle(e) { e.preventDefault(); setInstallPromptEvent(e); }
    window.addEventListener("beforeinstallprompt", handle);
    return () => window.removeEventListener("beforeinstallprompt", handle);
  }, []);

  const theme    = useMemo(() => buildTheme(themeMode), [themeMode]);
  const isDark   = themeMode === "dark";
  const roleView = session?.user?.role;
  const meta     = ROLE_META[roleView] || { label: "INKA", color: G8.orange };

  const toggleTheme = () => {
    const next = isDark ? "light" : "dark";
    setThemeMode(next);
    localStorage.setItem("inka_theme_mode", next);
  };

  if (!session) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AnimatedBackground isDark={isDark} />
        <Box sx={{ position: "relative", zIndex: 1 }}>
          <LoginView onLogin={setSession} />
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      {/* Animated background — fixed, behind everything */}
      <AnimatedBackground isDark={isDark} />

      {/* App shell */}
      <Box sx={{ position: "relative", zIndex: 1, minHeight: "100vh" }}>

        {/* ── Navigation bar ──────────────────────────────────────────── */}
        <AppBar position="sticky">
          <Toolbar sx={{ minHeight: { xs: 52, sm: 56 }, px: { xs: 2, sm: 3 }, gap: 1 }}>

            {/* Logo */}
            <Stack direction="row" alignItems="center" spacing={1.2} sx={{ mr: 2, flexShrink: 0 }}>
              <Box
                sx={{
                  width: 30,
                  height: 30,
                  borderRadius: "8px",
                  background: `linear-gradient(135deg, ${alpha(G8.orange, 0.9)} 0%, ${G8.orange} 100%)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: `0 2px 10px ${alpha(G8.orange, 0.4)}`,
                  flexShrink: 0,
                }}
              >
                <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: 14, lineHeight: 1 }}>I</Typography>
              </Box>
              <Typography
                sx={{
                  fontWeight: 700,
                  fontSize: "1rem",
                  letterSpacing: "-0.02em",
                  color: "text.primary",
                  fontFamily: '"DM Serif Display", Georgia, serif',
                }}
              >
                INKA
              </Typography>
            </Stack>

            {/* Role label */}
            <Chip
              label={meta.label}
              size="small"
              sx={{
                bgcolor: alpha(meta.color, isDark ? 0.15 : 0.08),
                color: meta.color,
                border: `1px solid ${alpha(meta.color, 0.2)}`,
                fontWeight: 500,
                fontSize: "0.75rem",
                height: 22,
                borderRadius: "100px",
              }}
            />

            <Box sx={{ flexGrow: 1 }} />

            {/* Right cluster */}
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <Tooltip title={isDark ? "Light mode" : "Dark mode"}>
                <IconButton size="small" onClick={toggleTheme}>
                  {isDark
                    ? <LightModeRoundedIcon sx={{ fontSize: 17 }} />
                    : <DarkModeRoundedIcon  sx={{ fontSize: 17 }} />}
                </IconButton>
              </Tooltip>

              {installPromptEvent && (
                <Button variant="outlined" size="small"
                  onClick={async () => {
                    installPromptEvent.prompt();
                    await installPromptEvent.userChoice;
                    setInstallPromptEvent(null);
                  }}
                >
                  Install
                </Button>
              )}

              <Divider
                orientation="vertical"
                flexItem
                sx={{ height: 18, alignSelf: "center", mx: 0.5, borderColor: "divider" }}
              />

              {/* User identity */}
              <Stack direction="row" alignItems="center" spacing={0.8}>
                <Avatar
                  sx={{
                    width: 26,
                    height: 26,
                    fontSize: "0.65rem",
                    fontWeight: 700,
                    bgcolor: alpha(meta.color, isDark ? 0.2 : 0.12),
                    color: meta.color,
                    border: `1.5px solid ${alpha(meta.color, 0.25)}`,
                  }}
                >
                  {initials(session.user.name)}
                </Avatar>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 500,
                    display: { xs: "none", sm: "block" },
                    maxWidth: 130,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    color: "text.primary",
                  }}
                >
                  {session.user.name}
                </Typography>
              </Stack>

              <Button
                variant="outlined"
                size="small"
                sx={{ ml: 0.5 }}
                onClick={() => { clearSession(); setSession(null); }}
              >
                Sign out
              </Button>
            </Stack>
          </Toolbar>
        </AppBar>

        {/* ── Content ─────────────────────────────────────────────────── */}
        <Fade in timeout={500}>
          <Container maxWidth="xl" sx={{ py: { xs: 2.5, sm: 3.5 }, px: { xs: 2, sm: 3 } }}>
            {roleView === "admin"           && <AdminView />}
            {roleView === "project_manager" && <ProjectManagerView masterData={masterData} role={roleView} />}
            {roleView === "engineer"        && <EngineerView />}
            {roleView === "client"          && <ClientView />}
          </Container>
        </Fade>
      </Box>
    </ThemeProvider>
  );
}
