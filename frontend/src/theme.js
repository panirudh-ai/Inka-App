import { createTheme, responsiveFontSizes, alpha } from "@mui/material/styles";

// ── Garden Eight design tokens ───────────────────────────────────────────────
export const G8 = {
  // core dark palette
  black:   "#141414",
  black2:  "#1c1d1d",
  black3:  "#1e1f1f",
  gray:    "#3c3c3c",
  // text
  offWhite: "#dbd6d0",
  muted:    "#8a8580",
  dim:      "#5a5550",
  // accent
  orange:   "#dc5648",
  orangeDim: "#9a3c30",
  // warm light palette
  cream:    "#f0ebe5",
  cream2:   "#faf7f4",
  warmBorder: "rgba(30,31,31,0.10)",
  // dark borders / overlays
  darkBorder:  "rgba(219,214,208,0.07)",
  darkBorder2: "rgba(219,214,208,0.12)",
  overlay:     "rgba(30,31,31,0.60)",
};

// ── Shadows ──────────────────────────────────────────────────────────────────
const mkShadow = (dark) => dark
  ? {
      xs:  "0 1px 2px rgba(0,0,0,0.5)",
      sm:  "0 2px 8px rgba(0,0,0,0.45), 0 1px 2px rgba(0,0,0,0.3)",
      md:  "0 4px 20px rgba(0,0,0,0.55), 0 1px 4px rgba(0,0,0,0.3)",
      lg:  "0 8px 32px rgba(0,0,0,0.6),  0 2px 8px rgba(0,0,0,0.35)",
      xl:  "0 20px 60px rgba(0,0,0,0.7), 0 4px 16px rgba(0,0,0,0.4)",
      accent: `0 4px 20px ${alpha(G8.orange, 0.35)}`,
    }
  : {
      xs:  "0 1px 2px rgba(30,31,31,0.06)",
      sm:  "0 2px 8px rgba(30,31,31,0.08), 0 1px 2px rgba(30,31,31,0.04)",
      md:  "0 4px 20px rgba(30,31,31,0.10), 0 1px 4px rgba(30,31,31,0.05)",
      lg:  "0 8px 32px rgba(30,31,31,0.12), 0 2px 8px rgba(30,31,31,0.06)",
      xl:  "0 20px 60px rgba(30,31,31,0.15), 0 4px 16px rgba(30,31,31,0.08)",
      accent: `0 4px 20px ${alpha(G8.orange, 0.25)}`,
    };

export function buildTheme(mode = "dark") {
  const isDark  = mode === "dark";
  const sh      = mkShadow(isDark);

  // Semantic aliases
  const bg      = isDark ? G8.black    : G8.cream;
  const surface = isDark ? G8.black3   : G8.cream2;
  const surface2= isDark ? G8.black2   : "#f0ebe5";
  const border  = isDark ? G8.darkBorder : G8.warmBorder;
  const border2 = isDark ? G8.darkBorder2 : "rgba(30,31,31,0.16)";
  const text     = isDark ? G8.offWhite : G8.black3;
  const muted    = isDark ? G8.muted    : "#6b6560";
  const hover    = isDark ? alpha("#fff", 0.04) : alpha(G8.black3, 0.04);

  const theme = createTheme({
    palette: {
      mode,
      primary:   { main: G8.orange,   light: alpha(G8.orange, 0.8), dark: G8.orangeDim, contrastText: "#fff" },
      secondary: { main: isDark ? G8.offWhite : G8.black3, contrastText: isDark ? G8.black3 : G8.offWhite },
      success:   { main: "#4ade80", light: alpha("#4ade80", 0.15) },
      error:     { main: "#f87171", light: alpha("#f87171", 0.15) },
      warning:   { main: "#fbbf24", light: alpha("#fbbf24", 0.15) },
      info:      { main: "#60a5fa", light: alpha("#60a5fa", 0.15) },
      background: { default: bg, paper: surface },
      text: {
        primary:   text,
        secondary: muted,
        disabled:  alpha(text, 0.35),
      },
      divider: border,
      action: {
        hover:    hover,
        selected: alpha(G8.orange, isDark ? 0.12 : 0.08),
        disabled: alpha(text, 0.3),
      },
    },

    typography: {
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontWeightLight:   300,
      fontWeightRegular: 400,
      fontWeightMedium:  500,
      fontWeightBold:    600,
      // Display headings — DM Serif Display for elegance
      h1: {
        fontFamily: '"DM Serif Display", Georgia, serif',
        fontSize: "clamp(2.2rem, 5vw, 3.5rem)",
        fontWeight: 400,
        letterSpacing: "-0.02em",
        lineHeight: 1.15,
        color: text,
      },
      h2: {
        fontFamily: '"DM Serif Display", Georgia, serif',
        fontSize: "clamp(1.6rem, 3.5vw, 2.4rem)",
        fontWeight: 400,
        letterSpacing: "-0.015em",
        lineHeight: 1.2,
        color: text,
      },
      h3: {
        fontFamily: '"DM Serif Display", Georgia, serif',
        fontSize: "clamp(1.25rem, 2.5vw, 1.75rem)",
        fontWeight: 400,
        letterSpacing: "-0.01em",
        color: text,
      },
      // UI headings — Inter
      h4: { fontSize: "1.125rem", fontWeight: 600, letterSpacing: "-0.01em", color: text },
      h5: { fontSize: "1rem",     fontWeight: 600, letterSpacing: "-0.005em", color: text },
      h6: { fontSize: "0.9375rem", fontWeight: 600, letterSpacing: "0em", color: text },
      subtitle1: { fontSize: "0.9375rem", fontWeight: 500, lineHeight: 1.55 },
      subtitle2: {
        fontSize: "0.6875rem",
        fontWeight: 600,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        color: muted,
      },
      body1: { fontSize: "0.9375rem", fontWeight: 400, lineHeight: 1.65, color: text },
      body2: { fontSize: "0.875rem",  fontWeight: 400, lineHeight: 1.6,  color: muted },
      caption: { fontSize: "0.8125rem", fontWeight: 400, color: muted, lineHeight: 1.5 },
      overline: {
        fontSize: "0.6875rem",
        fontWeight: 600,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: muted,
      },
      button: { fontSize: "0.875rem", fontWeight: 500, letterSpacing: "0.02em" },
    },

    shape: { borderRadius: 10 },

    shadows: [
      "none",
      sh.xs, sh.sm, sh.sm, sh.md,
      sh.md, sh.md, sh.lg, sh.lg,
      sh.lg, sh.lg, sh.lg, sh.xl,
      sh.xl, sh.xl, sh.xl, sh.xl,
      sh.xl, sh.xl, sh.xl, sh.xl,
      sh.xl, sh.xl, sh.xl, sh.xl,
    ],

    components: {
      // ── AppBar ──────────────────────────────────────────────────────────
      MuiAppBar: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: {
            backgroundColor: alpha(isDark ? G8.black2 : G8.cream2, isDark ? 0.88 : 0.92),
            backgroundImage: "none",
            backdropFilter: "blur(20px) saturate(180%)",
            WebkitBackdropFilter: "blur(20px) saturate(180%)",
            borderBottom: `1px solid ${border}`,
            boxShadow: "none",
            color: text,
          },
        },
      },

      // ── Paper ───────────────────────────────────────────────────────────
      MuiPaper: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: {
            backgroundImage: "none",
            backgroundColor: alpha(surface, isDark ? 0.85 : 0.9),
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: `1px solid ${border}`,
            boxShadow: sh.sm,
            transition: "box-shadow 250ms ease, border-color 250ms ease",
          },
          elevation0: { boxShadow: "none" },
          elevation1: { boxShadow: sh.xs },
          elevation2: { boxShadow: sh.sm },
          elevation3: { boxShadow: sh.md },
        },
      },

      MuiCard: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: {
            backgroundImage: "none",
            backgroundColor: alpha(surface, isDark ? 0.85 : 0.9),
            backdropFilter: "blur(12px)",
            border: `1px solid ${border}`,
            boxShadow: sh.sm,
            borderRadius: 12,
            transition: "box-shadow 250ms ease, transform 250ms ease, border-color 250ms ease",
            "&:hover": {
              boxShadow: sh.md,
            },
          },
        },
      },

      // ── Button ──────────────────────────────────────────────────────────
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: {
            textTransform: "none",
            fontWeight: 500,
            borderRadius: 100,   // pill shape — garden-eight signature
            letterSpacing: "0.03em",
            transition: "all 250ms cubic-bezier(.66,0,.34,1)",
            "&:focus-visible": { outline: `2px solid ${G8.orange}`, outlineOffset: 3 },
          },
          sizeSmall:  { fontSize: "0.8rem",   padding: "4px 14px",  height: 30 },
          sizeMedium: { fontSize: "0.875rem", padding: "7px 20px",  height: 36 },
          sizeLarge:  { fontSize: "0.9375rem", padding: "10px 28px", height: 44 },
          containedPrimary: {
            background: `linear-gradient(135deg, ${alpha(G8.orange, 0.9)} 0%, ${G8.orange} 100%)`,
            color: "#fff",
            boxShadow: "none",
            "&:hover": {
              background: G8.orange,
              boxShadow: sh.accent,
              transform: "translateY(-1px)",
            },
            "&:active": { transform: "translateY(0px)", boxShadow: "none" },
          },
          containedSecondary: {
            backgroundColor: isDark ? alpha(G8.offWhite, 0.92) : G8.black3,
            color: isDark ? G8.black3 : G8.offWhite,
            "&:hover": {
              backgroundColor: isDark ? G8.offWhite : "#000",
              transform: "translateY(-1px)",
            },
          },
          outlined: {
            borderColor: border2,
            color: text,
            backgroundColor: "transparent",
            "&:hover": {
              borderColor: G8.orange,
              color: G8.orange,
              backgroundColor: alpha(G8.orange, 0.05),
              transform: "translateY(-1px)",
            },
          },
          text: {
            color: muted,
            "&:hover": { color: text, backgroundColor: hover },
          },
        },
      },

      MuiIconButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            color: muted,
            transition: "all 200ms cubic-bezier(.66,0,.34,1)",
            "&:hover": { color: text, backgroundColor: hover },
          },
        },
      },

      // ── Inputs ──────────────────────────────────────────────────────────
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            backgroundColor: isDark ? alpha("#fff", 0.03) : alpha(G8.black3, 0.03),
            fontSize: "0.875rem",
            color: text,
            transition: "box-shadow 200ms",
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: border2,
              transition: "border-color 200ms",
            },
            "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: alpha(G8.orange, 0.5) },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: G8.orange,
              borderWidth: 1.5,
            },
            "&.Mui-focused": {
              boxShadow: `0 0 0 3px ${alpha(G8.orange, 0.12)}`,
            },
          },
          input: {
            padding: "9px 13px",
            "&::placeholder": { color: G8.dim, opacity: 1 },
          },
          sizeSmall: { "& input": { padding: "6px 11px" } },
        },
      },

      MuiInputLabel: {
        styleOverrides: {
          root: { fontSize: "0.875rem", color: muted },
          shrunk: { fontSize: "0.8125rem", fontWeight: 500, color: isDark ? alpha(G8.offWhite, 0.7) : alpha(G8.black3, 0.6) },
        },
      },

      MuiSelect: {
        styleOverrides: {
          select: { fontSize: "0.875rem", padding: "9px 13px" },
          icon: { color: muted },
        },
      },

      MuiMenuItem: {
        styleOverrides: {
          root: {
            fontSize: "0.875rem",
            color: text,
            "&:hover": { backgroundColor: hover },
            "&.Mui-selected": {
              backgroundColor: alpha(G8.orange, 0.1),
              color: G8.orange,
              "&:hover": { backgroundColor: alpha(G8.orange, 0.15) },
            },
          },
        },
      },

      // ── Table ───────────────────────────────────────────────────────────
      MuiTableContainer: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            border: `1px solid ${border}`,
            boxShadow: "none",
            backgroundColor: "transparent",
          },
        },
      },

      MuiTable: {
        styleOverrides: { root: { borderCollapse: "collapse" } },
      },

      MuiTableHead: {
        styleOverrides: {
          root: {
            "& .MuiTableCell-head": {
              color: muted,
              fontWeight: 600,
              fontSize: "0.6875rem",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              borderBottom: `1px solid ${border2}`,
              padding: "10px 16px",
              backgroundColor: isDark ? alpha(G8.black, 0.6) : alpha(G8.cream, 0.7),
            },
          },
        },
      },

      MuiTableBody: {
        styleOverrides: {
          root: {
            "& .MuiTableRow-root": {
              transition: "background 150ms",
              "&:hover": { backgroundColor: hover },
              "&:last-child .MuiTableCell-body": { borderBottom: "none" },
            },
          },
        },
      },

      MuiTableCell: {
        styleOverrides: {
          root: {
            borderBottom: `1px solid ${border}`,
            padding: "11px 16px",
            fontSize: "0.875rem",
            color: text,
          },
        },
      },

      MuiTableRow: {
        styleOverrides: {
          root: {
            "&.Mui-selected": { backgroundColor: alpha(G8.orange, 0.08) },
          },
        },
      },

      // ── Tabs ────────────────────────────────────────────────────────────
      MuiTabs: {
        styleOverrides: {
          root: {
            minHeight: 40,
            borderBottom: `1px solid ${border}`,
          },
          indicator: {
            height: 1.5,
            backgroundColor: G8.orange,
            borderRadius: "2px 2px 0 0",
          },
        },
      },

      MuiTab: {
        styleOverrides: {
          root: {
            textTransform: "none",
            fontWeight: 400,
            fontSize: "0.875rem",
            minHeight: 40,
            padding: "8px 16px",
            color: muted,
            letterSpacing: "0.01em",
            transition: "color 200ms",
            "&.Mui-selected": { color: text, fontWeight: 500 },
            "&:hover": { color: text },
          },
        },
      },

      // ── Chip ────────────────────────────────────────────────────────────
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 4,
            fontWeight: 500,
            fontSize: "0.75rem",
            height: 22,
            letterSpacing: "0.01em",
          },
          colorPrimary: {
            backgroundColor: alpha(G8.orange, isDark ? 0.15 : 0.1),
            color: G8.orange,
          },
          colorSuccess: {
            backgroundColor: alpha("#4ade80", 0.12),
            color: isDark ? "#4ade80" : "#16a34a",
          },
          colorError: {
            backgroundColor: alpha("#f87171", 0.12),
            color: isDark ? "#f87171" : "#dc2626",
          },
          colorWarning: {
            backgroundColor: alpha("#fbbf24", 0.12),
            color: isDark ? "#fbbf24" : "#d97706",
          },
          colorInfo: {
            backgroundColor: alpha("#60a5fa", 0.12),
            color: isDark ? "#60a5fa" : "#2563eb",
          },
          colorSecondary: {
            backgroundColor: border,
            color: muted,
          },
          outlined: {
            borderColor: border2,
            backgroundColor: "transparent",
          },
          sizeSmall: { height: 20, fontSize: "0.7rem" },
          deleteIcon: { color: `${muted} !important`, "&:hover": { color: `${text} !important` } },
        },
      },

      // ── Dialog ──────────────────────────────────────────────────────────
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 14,
            boxShadow: sh.xl,
            border: `1px solid ${border2}`,
            backgroundColor: isDark ? alpha(G8.black2, 0.96) : alpha(G8.cream2, 0.98),
            backdropFilter: "blur(24px)",
          },
        },
      },

      MuiDialogTitle: {
        styleOverrides: {
          root: {
            fontSize: "1rem",
            fontWeight: 600,
            padding: "20px 24px 16px",
            color: text,
            borderBottom: `1px solid ${border}`,
            letterSpacing: "-0.005em",
          },
        },
      },

      MuiDialogContent: {
        styleOverrides: { root: { padding: "20px 24px" } },
      },

      MuiDialogActions: {
        styleOverrides: {
          root: {
            padding: "14px 24px 20px",
            gap: 8,
            borderTop: `1px solid ${border}`,
          },
        },
      },

      MuiBackdrop: {
        styleOverrides: {
          root: { backgroundColor: alpha(G8.black, 0.7), backdropFilter: "blur(4px)" },
        },
      },

      // ── Accordion ───────────────────────────────────────────────────────
      MuiAccordion: {
        defaultProps: { disableGutters: true, elevation: 0 },
        styleOverrides: {
          root: {
            border: `1px solid ${border}`,
            borderRadius: "10px !important",
            backgroundColor: alpha(surface, isDark ? 0.6 : 0.7),
            backdropFilter: "blur(8px)",
            marginBottom: 8,
            boxShadow: "none",
            "&:before": { display: "none" },
            "&.Mui-expanded": { boxShadow: sh.sm },
          },
        },
      },

      MuiAccordionSummary: {
        styleOverrides: {
          root: {
            minHeight: 46,
            padding: "0 16px",
            "&.Mui-expanded": { borderBottom: `1px solid ${border}` },
          },
          content: { margin: "12px 0", fontWeight: 500, fontSize: "0.875rem" },
          expandIconWrapper: { color: muted },
        },
      },

      MuiAccordionDetails: {
        styleOverrides: { root: { padding: "16px" } },
      },

      // ── Divider ─────────────────────────────────────────────────────────
      MuiDivider: {
        styleOverrides: { root: { borderColor: border } },
      },

      // ── Alert ───────────────────────────────────────────────────────────
      MuiAlert: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            fontSize: "0.875rem",
            border: "1px solid transparent",
            backdropFilter: "blur(8px)",
          },
          standardSuccess: {
            backgroundColor: alpha("#4ade80", 0.1),
            color: isDark ? "#4ade80" : "#16a34a",
            borderColor: alpha("#4ade80", 0.2),
          },
          standardError: {
            backgroundColor: alpha("#f87171", 0.1),
            color: isDark ? "#f87171" : "#dc2626",
            borderColor: alpha("#f87171", 0.2),
          },
          standardWarning: {
            backgroundColor: alpha("#fbbf24", 0.1),
            color: isDark ? "#fbbf24" : "#d97706",
            borderColor: alpha("#fbbf24", 0.2),
          },
          standardInfo: {
            backgroundColor: alpha("#60a5fa", 0.1),
            color: isDark ? "#60a5fa" : "#2563eb",
            borderColor: alpha("#60a5fa", 0.2),
          },
        },
      },

      // ── Snackbar ────────────────────────────────────────────────────────
      MuiSnackbar: {
        defaultProps: { anchorOrigin: { vertical: "bottom", horizontal: "right" } },
      },

      // ── Tooltip ─────────────────────────────────────────────────────────
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            backgroundColor: isDark ? G8.black2 : G8.black3,
            color: G8.offWhite,
            fontSize: "0.75rem",
            borderRadius: 6,
            padding: "6px 10px",
            boxShadow: sh.md,
            border: `1px solid ${border}`,
          },
          arrow: { color: isDark ? G8.black2 : G8.black3 },
        },
      },

      // ── Switch ──────────────────────────────────────────────────────────
      MuiSwitch: {
        styleOverrides: {
          root: { width: 38, height: 22, padding: 0, margin: 6 },
          switchBase: {
            padding: 3,
            "&.Mui-checked": {
              transform: "translateX(16px)",
              "& + .MuiSwitch-track": { opacity: 1, backgroundColor: G8.orange },
            },
          },
          thumb: { width: 16, height: 16, boxShadow: "none", backgroundColor: "#fff" },
          track: {
            borderRadius: 11,
            backgroundColor: isDark ? alpha("#fff", 0.15) : alpha(G8.black3, 0.2),
            opacity: 1,
            transition: "background 250ms",
          },
        },
      },

      // ── FormControlLabel ─────────────────────────────────────────────────
      MuiFormControlLabel: {
        styleOverrides: {
          label: { fontSize: "0.875rem", color: text },
        },
      },

      // ── CircularProgress ────────────────────────────────────────────────
      MuiCircularProgress: {
        defaultProps: { size: 24, thickness: 3.5 },
        styleOverrides: { colorPrimary: { color: G8.orange } },
      },

      // ── Collapse ────────────────────────────────────────────────────────
      MuiCollapse: {
        styleOverrides: { root: { transition: "height 220ms cubic-bezier(.66,0,.34,1)" } },
      },

      // ── CssBaseline ─────────────────────────────────────────────────────
      MuiCssBaseline: {
        styleOverrides: {
          "*, *::before, *::after": { boxSizing: "border-box" },
          html: { scrollBehavior: "smooth" },
          body: {
            WebkitFontSmoothing: "antialiased",
            MozOsxFontSmoothing: "grayscale",
            backgroundColor: isDark ? G8.black : G8.cream,
          },
          "::-webkit-scrollbar": { width: 6, height: 6 },
          "::-webkit-scrollbar-track": { backgroundColor: "transparent" },
          "::-webkit-scrollbar-thumb": {
            backgroundColor: isDark ? alpha("#fff", 0.12) : alpha(G8.black3, 0.15),
            borderRadius: 3,
          },
          "::-webkit-scrollbar-thumb:hover": {
            backgroundColor: isDark ? alpha("#fff", 0.22) : alpha(G8.black3, 0.25),
          },
          "::selection": {
            backgroundColor: alpha(G8.orange, 0.3),
            color: isDark ? G8.offWhite : G8.black3,
          },
        },
      },
    },
  });

  return responsiveFontSizes(theme, { factor: 1.3 });
}
