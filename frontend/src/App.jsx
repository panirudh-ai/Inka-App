import { useEffect, useMemo, useState } from "react";
import {
  Avatar,
  Button,
  Chip,
  Divider,
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  Tooltip,
} from "@heroui/react";
import AdminView from "./pages/AdminView";
import ProjectManagerView from "./pages/ProjectManagerView";
import EngineerView from "./pages/EngineerView";
import ClientView from "./pages/ClientView";
import LoginView from "./pages/LoginView";
import { clearSession, getSession, safeGet } from "./api/client";

// Role metadata
const ROLE_META = {
  admin:           { label: "Admin",           badge: "Admin",   color: "violet" },
  project_manager: { label: "Project Manager", badge: "PM",      color: "primary" },
  engineer:        { label: "Engineer",         badge: "Eng",     color: "success" },
  client:          { label: "Client Portal",    badge: "Client",  color: "warning" },
};

const ROLE_HEX = {
  admin:           "#635BFF",
  project_manager: "#0073E6",
  engineer:        "#1A9E5D",
  client:          "#B7791F",
};

function initials(name = "") {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "?";
}

// Dark mode helper — applies/removes "dark" class on <html>
function applyDark(isDark) {
  if (isDark) document.documentElement.classList.add("dark");
  else document.documentElement.classList.remove("dark");
}

export default function App() {
  const [session, setSession]     = useState(getSession());
  const [themeMode, setThemeMode] = useState(() => {
    const stored = localStorage.getItem("inka_theme_mode") || "light";
    applyDark(stored === "dark");
    return stored;
  });
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

  const isDark  = themeMode === "dark";
  const roleView = session?.user?.role;
  const meta     = ROLE_META[roleView] || { label: "INKA", badge: "?", color: "default" };
  const roleHex  = ROLE_HEX[roleView] || "#635BFF";

  const toggleTheme = () => {
    const next = isDark ? "light" : "dark";
    setThemeMode(next);
    localStorage.setItem("inka_theme_mode", next);
    applyDark(next === "dark");
  };

  if (!session) {
    return <LoginView onLogin={setSession} isDark={isDark} onToggleTheme={toggleTheme} />;
  }

  return (
    <div className="min-h-screen bg-[#F6F9FC] dark:bg-[#0D1B2E]">
      {/* ── Top Navigation Bar ─────────────────────────────────────── */}
      <Navbar
        isBordered
        maxWidth="full"
        height="52px"
        classNames={{
          base: "bg-white dark:bg-[#0F2240] border-b border-[#E3E8EF] dark:border-[#1E3A5F] shadow-none",
          wrapper: "px-4 sm:px-6",
        }}
      >
        {/* Brand */}
        <NavbarBrand className="gap-2 mr-4">
          <div className="w-7 h-7 rounded-[7px] bg-gradient-to-br from-[#7B73FF] to-[#635BFF] flex items-center justify-center shadow-indigo-sm flex-shrink-0">
            <span className="text-white font-bold text-[13px] leading-none">I</span>
          </div>
          <span className="font-bold text-[#0A2540] dark:text-[#E2E8F0] text-[1rem] tracking-tight">
            INKA
          </span>
        </NavbarBrand>

        {/* Role badge */}
        <NavbarContent justify="start">
          <NavbarItem>
            <Chip
              size="sm"
              variant="flat"
              color={meta.color}
              classNames={{
                base: "h-[22px] rounded-[4px] border",
                content: "font-semibold text-[0.75rem] px-1",
              }}
            >
              {meta.label}
            </Chip>
          </NavbarItem>
        </NavbarContent>

        {/* Right actions */}
        <NavbarContent justify="end" className="gap-1">
          {/* Theme toggle */}
          <NavbarItem>
            <Tooltip content={isDark ? "Light mode" : "Dark mode"} placement="bottom">
              <button
                onClick={toggleTheme}
                className="w-8 h-8 rounded-md flex items-center justify-center text-[#697386] hover:bg-[#F0F4F9] dark:hover:bg-[#162B47] transition-colors"
              >
                {isDark ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.25a.75.75 0 0 1 .75.75v2.25a.75.75 0 0 1-1.5 0V3a.75.75 0 0 1 .75-.75ZM7.5 12a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM18.894 6.166a.75.75 0 0 0-1.06-1.06l-1.591 1.59a.75.75 0 1 0 1.06 1.061l1.591-1.59ZM21.75 12a.75.75 0 0 1-.75.75h-2.25a.75.75 0 0 1 0-1.5H21a.75.75 0 0 1 .75.75ZM17.834 18.894a.75.75 0 0 0 1.06-1.06l-1.59-1.591a.75.75 0 1 0-1.061 1.06l1.59 1.591ZM12 18a.75.75 0 0 1 .75.75V21a.75.75 0 0 1-1.5 0v-2.25A.75.75 0 0 1 12 18ZM7.758 17.303a.75.75 0 0 0-1.061-1.06l-1.591 1.59a.75.75 0 0 0 1.06 1.061l1.591-1.59ZM6 12a.75.75 0 0 1-.75.75H3a.75.75 0 0 1 0-1.5h2.25A.75.75 0 0 1 6 12ZM6.697 7.757a.75.75 0 0 0 1.06-1.06l-1.59-1.591a.75.75 0 0 0-1.061 1.06l1.59 1.591Z"/>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M9.528 1.718a.75.75 0 0 1 .162.819A8.97 8.97 0 0 0 9 6a9 9 0 0 0 9 9 8.97 8.97 0 0 0 3.463-.69.75.75 0 0 1 .981.98 10.503 10.503 0 0 1-9.694 6.46c-5.799 0-10.5-4.7-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 0 1 .818.162Z" clipRule="evenodd"/>
                  </svg>
                )}
              </button>
            </Tooltip>
          </NavbarItem>

          {/* Install button */}
          {installPromptEvent && (
            <NavbarItem>
              <Button
                size="sm"
                variant="bordered"
                onPress={async () => {
                  installPromptEvent.prompt();
                  await installPromptEvent.userChoice;
                  setInstallPromptEvent(null);
                }}
                classNames={{ base: "h-7 text-xs" }}
              >
                Install
              </Button>
            </NavbarItem>
          )}

          <NavbarItem>
            <Divider orientation="vertical" className="h-5 mx-1" />
          </NavbarItem>

          {/* User avatar + name */}
          <NavbarItem className="flex items-center gap-2">
            <Avatar
              name={initials(session.user.name)}
              size="sm"
              classNames={{
                base: "w-7 h-7 text-[0.7rem] font-bold flex-shrink-0",
              }}
              style={{
                backgroundColor: `${roleHex}26`,
                color: roleHex,
                border: `1.5px solid ${roleHex}4D`,
              }}
            />
            <span className="hidden sm:block text-sm font-medium text-[#1A1F36] dark:text-[#C9D7E8] max-w-[140px] truncate">
              {session.user.name}
            </span>
          </NavbarItem>

          <NavbarItem>
            <Button
              size="sm"
              variant="bordered"
              onPress={() => { clearSession(); setSession(null); }}
              classNames={{ base: "h-7 text-xs ml-1" }}
            >
              Sign out
            </Button>
          </NavbarItem>
        </NavbarContent>
      </Navbar>

      {/* ── Page content ───────────────────────────────────────────── */}
      <main className="max-w-[1536px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {roleView === "admin"           && <AdminView />}
        {roleView === "project_manager" && <ProjectManagerView masterData={masterData} role={roleView} />}
        {roleView === "engineer"        && <EngineerView />}
        {roleView === "client"          && <ClientView />}
      </main>
    </div>
  );
}
