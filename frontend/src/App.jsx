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
import DarkModeRoundedIcon  from "@mui/icons-material/DarkModeRounded";
import LightModeRoundedIcon from "@mui/icons-material/LightModeRounded";
import AdminView            from "./pages/AdminView";
import ProjectManagerView   from "./pages/ProjectManagerView";
import EngineerView         from "./pages/EngineerView";
import ClientView           from "./pages/ClientView";
import LoginView            from "./pages/LoginView";
import AnimatedBackground   from "./components/AnimatedBackground";
import { clearSession, getSession, safeGet } from "./api/client";
import { buildTheme, G8 } from "./theme.js";

const ROLE_META = {
  admin:           { label: "Admin",           color: G8.orange  },  // CSB yellow
  project_manager: { label: "Project Manager", color: "#6E9EFF"  },  // soft blue
  engineer:        { label: "Engineer",         color: "#57C97A"  },  // soft green
  client:          { label: "Client Portal",    color: "#AAAAAA"  },  // ash
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
      <AnimatedBackground isDark={isDark} />

      <Box sx={{ position: "relative", zIndex: 1, minHeight: "100vh" }}>

        {/* ── Navigation bar ────────────────────────────────────── */}
        <AppBar position="sticky">
          <Toolbar
            sx={{
              minHeight: { xs: 48, sm: 52 },
              px: { xs: 2, sm: 3 },
              gap: 1,
            }}
          >
            {/* Logo — CSB style: yellow square, dark text */}
            <Stack direction="row" alignItems="center" spacing={1.2} sx={{ mr: 2, flexShrink: 0 }}>
              <Box sx={{
                width: 26, height: 26,
                borderRadius: "6px",
                backgroundColor: G8.orange,
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: isDark
                  ? `0 0 10px ${alpha(G8.orange, 0.55)}, 0 2px 6px ${alpha(G8.orange, 0.35)}`
                  : `0 1px 4px ${alpha(G8.orangeDim, 0.3)}`,
                flexShrink: 0,
              }}>
                <Typography sx={{
                  color: "#151515",     // dark text on yellow — CSB exact
                  fontWeight: 800,
                  fontSize: 12,
                  lineHeight: 1,
                }}>I</Typography>
              </Box>
              <Typography sx={{
                fontWeight: 700,
                fontSize: "0.95rem",
                letterSpacing: "-0.03em",
                color: isDark ? G8.orange : G8.orangeDim,
              }}>
                INKA
              </Typography>
            </Stack>

            {/* Role chip */}
            <Chip
              label={meta.label}
              size="small"
              sx={{
                bgcolor: alpha(meta.color, isDark ? 0.15 : 0.08),
                color: meta.color,
                border: `1px solid ${alpha(meta.color, 0.22)}`,
                boxShadow: isDark ? `0 0 8px ${alpha(meta.color, 0.2)}` : undefined,
                fontWeight: 500,
                fontSize: "0.75rem",
                height: 22,
                borderRadius: "6px",
                letterSpacing: "-0.005em",
              }}
            />

            <Box sx={{ flexGrow: 1 }} />

            {/* Right cluster */}
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <Tooltip title={isDark ? "Light mode" : "Dark mode"}>
                <IconButton size="small" onClick={toggleTheme}>
                  {isDark
                    ? <LightModeRoundedIcon sx={{ fontSize: 16 }} />
                    : <DarkModeRoundedIcon  sx={{ fontSize: 16 }} />}
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

              <Divider
                orientation="vertical" flexItem
                sx={{ height: 16, alignSelf: "center", mx: 0.5, borderColor: "divider" }}
              />

              {/* User identity */}
              <Stack direction="row" alignItems="center" spacing={0.8}>
                <Avatar sx={{
                  width: 24, height: 24,
                  fontSize: "0.6rem",
                  fontWeight: 700,
                  bgcolor: alpha(meta.color, isDark ? 0.18 : 0.1),
                  color: meta.color,
                  border: `1.5px solid ${alpha(meta.color, 0.25)}`,
                  boxShadow: `0 1px 3px rgba(0,0,0,0.2), 0 0 0 1px ${alpha(meta.color, 0.15)}`,
                }}>
                  {initials(session.user.name)}
                </Avatar>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 500,
                    fontSize: "0.8125rem",
                    display: { xs: "none", sm: "block" },
                    maxWidth: 130,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    color: "text.primary",
                    letterSpacing: "-0.01em",
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

        {/* ── Content ─────────────────────────────────────────── */}
        <Fade in timeout={400}>
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
