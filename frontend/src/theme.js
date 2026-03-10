import { createTheme, responsiveFontSizes } from "@mui/material/styles";

export function buildTheme(mode = "light") {
  const isDark = mode === "dark";
  const theme = createTheme({
    palette: {
      mode,
      primary: {
        main: isDark ? "#2dd4bf" : "#0f766e",
      },
      secondary: {
        main: isDark ? "#fb923c" : "#f97316",
      },
      background: {
        default: isDark ? "#0b1220" : "#f1f5f9",
        paper: isDark ? "#111827" : "#ffffff",
      },
    },
    typography: {
      fontFamily: "Poppins, sans-serif",
      h4: {
        fontWeight: 700,
        letterSpacing: "0.01em",
        fontSize: "clamp(1.6rem, 3.8vw, 2.2rem)",
      },
      h6: {
        fontWeight: 600,
        fontSize: "clamp(1rem, 2.8vw, 1.25rem)",
      },
      body1: {
        fontSize: "clamp(0.9rem, 2.3vw, 1rem)",
      },
      body2: {
        fontSize: "clamp(0.82rem, 2.1vw, 0.95rem)",
      },
    },
    shape: {
      borderRadius: 14,
    },
    components: {
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
            border: isDark ? "1px solid rgba(148, 163, 184, 0.25)" : "1px solid rgba(15, 118, 110, 0.08)",
            boxShadow: isDark
              ? "0 10px 40px rgba(2, 6, 23, 0.45)"
              : "0 10px 35px rgba(15, 23, 42, 0.06)",
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: "none",
            fontWeight: 600,
            transition: "transform 220ms ease, box-shadow 220ms ease",
          },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            fontSize: "clamp(0.72rem, 2vw, 0.86rem)",
            minHeight: 44,
          },
        },
      },
    },
  });
  return responsiveFontSizes(theme);
}
