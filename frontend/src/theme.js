import { createTheme, responsiveFontSizes, alpha } from "@mui/material/styles";

// ── Notion-inspired design tokens ────────────────────────────────────────────
export const G8 = {
  // Dark palette — Notion dark
  black:   "#191919",
  black2:  "#202020",
  black3:  "#2F2F2F",
  gray:    "#454545",
  // Text
  offWhite:    "rgba(255,255,255,0.87)",
  muted:       "rgba(255,255,255,0.46)",
  dim:         "rgba(255,255,255,0.24)",
  // Light palette
  cream:       "#FFFFFF",
  cream2:      "#F7F7F5",
  cream3:      "#EFEFED",
  // Brand accent — warm orange
  orange:      "#E07B54",
  orangeDim:   "#C4612D",
  orangeLight: "#F5A689",
  // Borders
  warmBorder:  "rgba(55,53,47,0.09)",
  warmBorder2: "rgba(55,53,47,0.16)",
  darkBorder:  "rgba(255,255,255,0.082)",
  darkBorder2: "rgba(255,255,255,0.135)",
  // Overlay
  overlay: "rgba(0,0,0,0.65)",
};

// ── Multi-layer shadow system ─────────────────────────────────────────────────
// Each level has 3 layers: ambient + directional + ring
const mkShadow = (dark) => dark
  ? {
      xs:  `0 1px 2px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04)`,
      sm:  `0 1px 3px rgba(0,0,0,0.45), 0 3px 10px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.045)`,
      md:  `0 2px 5px rgba(0,0,0,0.45), 0 6px 24px rgba(0,0,0,0.32), 0 16px 40px rgba(0,0,0,0.18), 0 0 0 1px rgba(255,255,255,0.05)`,
      lg:  `0 4px 10px rgba(0,0,0,0.45), 0 12px 40px rgba(0,0,0,0.38), 0 32px 80px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.06)`,
      xl:  `0 8px 20px rgba(0,0,0,0.50), 0 24px 80px rgba(0,0,0,0.42), 0 60px 120px rgba(0,0,0,0.28), 0 0 0 1px rgba(255,255,255,0.06)`,
      accent: `0 2px 6px ${alpha(G8.orange, 0.45)}, 0 8px 20px ${alpha(G8.orange, 0.2)}, 0 0 0 1px ${alpha(G8.orange, 0.22)}`,
      inset: `inset 0 1px 2px rgba(0,0,0,0.25), inset 0 0 0 1px rgba(0,0,0,0.15)`,
    }
  : {
      xs:  `0 1px 2px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.04)`,
      sm:  `0 1px 3px rgba(0,0,0,0.06), 0 3px 10px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.04)`,
      md:  `0 2px 5px rgba(0,0,0,0.06), 0 6px 24px rgba(0,0,0,0.05), 0 16px 40px rgba(0,0,0,0.03), 0 0 0 1px rgba(0,0,0,0.05)`,
      lg:  `0 4px 10px rgba(0,0,0,0.07), 0 12px 40px rgba(0,0,0,0.06), 0 32px 80px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.06)`,
      xl:  `0 8px 20px rgba(0,0,0,0.08), 0 24px 80px rgba(0,0,0,0.07), 0 60px 120px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.07)`,
      accent: `0 2px 6px ${alpha(G8.orange, 0.3)}, 0 8px 20px ${alpha(G8.orange, 0.12)}, 0 0 0 1px ${alpha(G8.orange, 0.15)}`,
      inset: `inset 0 1px 2px rgba(0,0,0,0.06), inset 0 0 0 1px rgba(0,0,0,0.04)`,
    };

export function buildTheme(mode = "dark") {
  const isDark  = mode === "dark";
  const sh      = mkShadow(isDark);

  const bg       = isDark ? G8.black   : G8.cream;
  const surface  = isDark ? G8.black2  : G8.cream;
  const surface2 = isDark ? G8.black3  : G8.cream2;
  const border   = isDark ? G8.darkBorder  : G8.warmBorder;
  const border2  = isDark ? G8.darkBorder2 : G8.warmBorder2;
  const text     = isDark ? G8.offWhite : "#37352F";
  const muted    = isDark ? G8.muted    : "rgba(55,53,47,0.62)";
  const hover    = isDark ? alpha("#fff", 0.055) : alpha("#000", 0.035);

  const theme = createTheme({
    palette: {
      mode,
      primary:   { main: G8.orange, light: G8.orangeLight, dark: G8.orangeDim, contrastText: "#fff" },
      secondary: { main: isDark ? "rgba(255,255,255,0.82)" : "#37352F", contrastText: isDark ? "#191919" : "#fff" },
      success:   { main: "#3F9142", light: "rgba(63,145,66,0.12)" },
      error:     { main: "#EB5757", light: "rgba(235,87,87,0.12)" },
      warning:   { main: "#CB912F", light: "rgba(203,145,47,0.12)" },
      info:      { main: "#2383E2", light: "rgba(35,131,226,0.12)" },
      background: { default: bg, paper: surface },
      text: {
        primary:   text,
        secondary: muted,
        disabled:  alpha(text, 0.3),
      },
      divider: border,
      action: {
        hover:    hover,
        selected: alpha(G8.orange, isDark ? 0.14 : 0.08),
        disabled: alpha(text, 0.3),
      },
    },

    typography: {
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontWeightLight:   300,
      fontWeightRegular: 400,
      fontWeightMedium:  500,
      fontWeightBold:    600,
      h1: { fontSize: "clamp(1.875rem, 4vw, 2.5rem)", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.2, color: text },
      h2: { fontSize: "clamp(1.5rem, 3vw, 1.875rem)", fontWeight: 700, letterSpacing: "-0.025em", lineHeight: 1.25, color: text },
      h3: { fontSize: "clamp(1.2rem, 2vw, 1.5rem)",   fontWeight: 600, letterSpacing: "-0.02em",  lineHeight: 1.3,  color: text },
      h4: { fontSize: "1.125rem", fontWeight: 600, letterSpacing: "-0.015em", color: text },
      h5: { fontSize: "1rem",     fontWeight: 600, letterSpacing: "-0.01em",  color: text },
      h6: { fontSize: "0.9375rem", fontWeight: 600, letterSpacing: "-0.005em", color: text },
      subtitle1: { fontSize: "0.9375rem", fontWeight: 500, lineHeight: 1.55 },
      subtitle2: { fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: muted },
      body1:  { fontSize: "0.9375rem", fontWeight: 400, lineHeight: 1.65, color: text },
      body2:  { fontSize: "0.875rem",  fontWeight: 400, lineHeight: 1.6,  color: muted },
      caption:  { fontSize: "0.8125rem", fontWeight: 400, color: muted, lineHeight: 1.5 },
      overline: { fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: muted },
      button:   { fontSize: "0.875rem",  fontWeight: 500, letterSpacing: "-0.005em" },
    },

    shape: { borderRadius: 6 },

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
            backgroundColor: isDark
              ? alpha(G8.black2, 0.92)
              : alpha(G8.cream, 0.94),
            backgroundImage: "none",
            backdropFilter: "blur(20px) saturate(180%)",
            WebkitBackdropFilter: "blur(20px) saturate(180%)",
            borderBottom: `1px solid ${border}`,
            boxShadow: isDark
              ? `0 1px 0 rgba(255,255,255,0.05), 0 2px 12px rgba(0,0,0,0.3)`
              : `0 1px 0 rgba(0,0,0,0.07), 0 2px 12px rgba(0,0,0,0.04)`,
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
            backgroundColor: isDark ? alpha(G8.black2, 0.94) : G8.cream,
            border: `1px solid ${border}`,
            boxShadow: sh.sm,
            transition: "box-shadow 200ms ease, border-color 200ms ease",
          },
          elevation0: { boxShadow: "none" },
          elevation1: { boxShadow: sh.xs },
          elevation2: { boxShadow: sh.sm },
          elevation3: { boxShadow: sh.md },
        },
      },

      // ── Card ────────────────────────────────────────────────────────────
      MuiCard: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: {
            backgroundImage: "none",
            backgroundColor: isDark ? G8.black2 : G8.cream,
            border: `1px solid ${border}`,
            boxShadow: sh.sm,
            borderRadius: 8,
            transition: "box-shadow 200ms ease, transform 200ms ease, border-color 200ms ease",
            "&:hover": {
              boxShadow: sh.md,
              borderColor: isDark ? G8.darkBorder2 : G8.warmBorder2,
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
            borderRadius: 6,
            letterSpacing: "-0.005em",
            transition: "all 150ms ease",
            "&:focus-visible": { outline: `2px solid ${G8.orange}`, outlineOffset: 2 },
          },
          sizeSmall:  { fontSize: "0.8125rem", padding: "4px 12px",  height: 28 },
          sizeMedium: { fontSize: "0.875rem",  padding: "6px 16px",  height: 34 },
          sizeLarge:  { fontSize: "0.9rem",    padding: "9px 22px",  height: 40 },
          containedPrimary: {
            backgroundColor: G8.orange,
            color: "#fff",
            boxShadow: `0 1px 2px ${alpha(G8.orange, 0.35)}, inset 0 1px 0 ${alpha("#fff", 0.15)}`,
            "&:hover": {
              backgroundColor: G8.orangeDim,
              boxShadow: `0 2px 8px ${alpha(G8.orange, 0.45)}, 0 4px 16px ${alpha(G8.orange, 0.2)}, inset 0 1px 0 ${alpha("#fff", 0.12)}`,
              transform: "translateY(-1px)",
            },
            "&:active": { transform: "translateY(0)", boxShadow: "none" },
          },
          containedSecondary: {
            backgroundColor: isDark ? alpha("#fff", 0.1) : alpha("#37352F", 0.07),
            color: text,
            boxShadow: `0 0 0 1px ${border2}, 0 1px 2px rgba(0,0,0,0.1)`,
            "&:hover": {
              backgroundColor: isDark ? alpha("#fff", 0.16) : alpha("#37352F", 0.12),
              boxShadow: `0 0 0 1px ${border2}, 0 2px 6px rgba(0,0,0,0.12)`,
              transform: "translateY(-1px)",
            },
          },
          outlined: {
            borderColor: border2,
            color: text,
            backgroundColor: "transparent",
            boxShadow: `0 1px 2px rgba(0,0,0,${isDark ? "0.3" : "0.04"})`,
            "&:hover": {
              borderColor: G8.orange,
              color: G8.orange,
              backgroundColor: alpha(G8.orange, 0.06),
              boxShadow: `0 1px 4px ${alpha(G8.orange, 0.2)}, 0 0 0 1px ${alpha(G8.orange, 0.2)}`,
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
            borderRadius: 6,
            color: muted,
            transition: "all 150ms ease",
            "&:hover": { color: text, backgroundColor: hover },
          },
        },
      },

      // ── Inputs ──────────────────────────────────────────────────────────
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 6,
            backgroundColor: isDark ? alpha("#fff", 0.03) : alpha("#000", 0.02),
            fontSize: "0.9375rem",
            color: text,
            transition: "box-shadow 160ms ease",
            boxShadow: sh.inset,
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: border2,
              transition: "border-color 160ms",
            },
            "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: alpha(G8.orange, 0.5) },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: G8.orange,
              borderWidth: 1.5,
            },
            "&.Mui-focused": {
              boxShadow: `0 0 0 3px ${alpha(G8.orange, 0.14)}, ${sh.inset}`,
            },
          },
          input: {
            padding: "8px 12px",
            "&::placeholder": { color: muted, opacity: 1 },
          },
          sizeSmall: { "& input": { padding: "6px 10px" } },
        },
      },

      MuiInputLabel: {
        styleOverrides: {
          root: { fontSize: "0.875rem", color: muted },
          shrunk: { fontSize: "0.8125rem", fontWeight: 500 },
        },
      },

      MuiSelect: {
        styleOverrides: {
          select: { fontSize: "0.875rem", padding: "8px 12px" },
          icon: { color: muted },
        },
      },

      MuiMenuItem: {
        styleOverrides: {
          root: {
            fontSize: "0.875rem",
            color: text,
            borderRadius: 4,
            "&:hover": { backgroundColor: hover },
            "&.Mui-selected": {
              backgroundColor: alpha(G8.orange, 0.1),
              color: G8.orange,
              "&:hover": { backgroundColor: alpha(G8.orange, 0.14) },
            },
          },
        },
      },

      // ── Table ───────────────────────────────────────────────────────────
      MuiTableContainer: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            border: `1px solid ${border}`,
            boxShadow: sh.sm,
            backgroundColor: isDark ? alpha(G8.black2, 0.7) : G8.cream,
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
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              borderBottom: `1px solid ${border2}`,
              padding: "10px 16px",
              backgroundColor: isDark ? alpha(G8.black, 0.6) : G8.cream2,
            },
          },
        },
      },

      MuiTableBody: {
        styleOverrides: {
          root: {
            "& .MuiTableRow-root": {
              transition: "background 120ms",
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
            padding: "10px 16px",
            fontSize: "0.875rem",
            color: text,
          },
        },
      },

      MuiTableRow: {
        styleOverrides: {
          root: { "&.Mui-selected": { backgroundColor: alpha(G8.orange, 0.07) } },
        },
      },

      // ── Tabs ────────────────────────────────────────────────────────────
      MuiTabs: {
        styleOverrides: {
          root: { minHeight: 38, borderBottom: `1px solid ${border}` },
          indicator: {
            height: 2,
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
            minHeight: 38,
            padding: "6px 14px",
            color: muted,
            letterSpacing: "-0.005em",
            transition: "color 150ms",
            "&.Mui-selected": { color: text, fontWeight: 500 },
            "&:hover:not(.Mui-selected)": { color: text },
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
            letterSpacing: "-0.005em",
          },
          colorPrimary: {
            backgroundColor: alpha(G8.orange, isDark ? 0.18 : 0.1),
            color: isDark ? G8.orangeLight : G8.orangeDim,
          },
          colorSuccess: {
            backgroundColor: "rgba(63,145,66,0.12)",
            color: isDark ? "#6FCF73" : "#2D7D30",
          },
          colorError: {
            backgroundColor: "rgba(235,87,87,0.12)",
            color: isDark ? "#F28B82" : "#C62828",
          },
          colorWarning: {
            backgroundColor: "rgba(203,145,47,0.12)",
            color: isDark ? "#F2C55C" : "#A56B00",
          },
          colorInfo: {
            backgroundColor: "rgba(35,131,226,0.12)",
            color: isDark ? "#70B5F9" : "#1565C0",
          },
          colorSecondary: { backgroundColor: border, color: muted },
          outlined:       { borderColor: border2, backgroundColor: "transparent" },
          sizeSmall:      { height: 20, fontSize: "0.7rem" },
          deleteIcon: { color: `${muted} !important`, "&:hover": { color: `${text} !important` } },
        },
      },

      // ── Dialog ──────────────────────────────────────────────────────────
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 10,
            border: `1px solid ${border2}`,
            backgroundColor: isDark ? G8.black2 : G8.cream,
            boxShadow: isDark
              ? `0 8px 20px rgba(0,0,0,0.55), 0 24px 80px rgba(0,0,0,0.45), 0 60px 120px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.06)`
              : `0 8px 20px rgba(0,0,0,0.1), 0 24px 80px rgba(0,0,0,0.08), 0 60px 120px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.06)`,
            backdropFilter: "blur(20px)",
          },
        },
      },

      MuiDialogTitle: {
        styleOverrides: {
          root: {
            fontSize: "1rem",
            fontWeight: 600,
            padding: "18px 22px 14px",
            color: text,
            borderBottom: `1px solid ${border}`,
            letterSpacing: "-0.01em",
          },
        },
      },

      MuiDialogContent: {
        styleOverrides: { root: { padding: "18px 22px" } },
      },

      MuiDialogActions: {
        styleOverrides: {
          root: {
            padding: "12px 22px 18px",
            gap: 8,
            borderTop: `1px solid ${border}`,
          },
        },
      },

      MuiBackdrop: {
        styleOverrides: {
          root: {
            backgroundColor: alpha("#000", 0.65),
            backdropFilter: "blur(6px)",
          },
        },
      },

      // ── Accordion ───────────────────────────────────────────────────────
      MuiAccordion: {
        defaultProps: { disableGutters: true, elevation: 0 },
        styleOverrides: {
          root: {
            border: `1px solid ${border}`,
            borderRadius: "8px !important",
            backgroundColor: isDark ? alpha(G8.black2, 0.85) : G8.cream,
            marginBottom: 6,
            boxShadow: sh.xs,
            "&:before": { display: "none" },
            "&.Mui-expanded": { boxShadow: sh.sm },
          },
        },
      },

      MuiAccordionSummary: {
        styleOverrides: {
          root: {
            minHeight: 44,
            padding: "0 14px",
            "&.Mui-expanded": { borderBottom: `1px solid ${border}` },
          },
          content: { margin: "10px 0", fontWeight: 500, fontSize: "0.875rem" },
          expandIconWrapper: { color: muted },
        },
      },

      MuiAccordionDetails: {
        styleOverrides: { root: { padding: "14px 16px" } },
      },

      // ── Divider ─────────────────────────────────────────────────────────
      MuiDivider: {
        styleOverrides: { root: { borderColor: border } },
      },

      // ── Alert ───────────────────────────────────────────────────────────
      MuiAlert: {
        styleOverrides: {
          root: {
            borderRadius: 6,
            fontSize: "0.875rem",
            border: "1px solid transparent",
            boxShadow: sh.xs,
          },
          standardSuccess: {
            backgroundColor: "rgba(63,145,66,0.1)",
            color: isDark ? "#6FCF73" : "#2D7D30",
            borderColor: "rgba(63,145,66,0.2)",
          },
          standardError: {
            backgroundColor: "rgba(235,87,87,0.1)",
            color: isDark ? "#F28B82" : "#C62828",
            borderColor: "rgba(235,87,87,0.2)",
          },
          standardWarning: {
            backgroundColor: "rgba(203,145,47,0.1)",
            color: isDark ? "#F2C55C" : "#A56B00",
            borderColor: "rgba(203,145,47,0.2)",
          },
          standardInfo: {
            backgroundColor: "rgba(35,131,226,0.1)",
            color: isDark ? "#70B5F9" : "#1565C0",
            borderColor: "rgba(35,131,226,0.2)",
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
            backgroundColor: isDark ? G8.black3 : "#37352F",
            color: "rgba(255,255,255,0.9)",
            fontSize: "0.75rem",
            borderRadius: 5,
            padding: "5px 9px",
            boxShadow: sh.md,
            border: `1px solid ${border}`,
          },
          arrow: { color: isDark ? G8.black3 : "#37352F" },
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
          thumb: {
            width: 16, height: 16,
            boxShadow: "0 1px 3px rgba(0,0,0,0.35)",
            backgroundColor: "#fff",
          },
          track: {
            borderRadius: 11,
            backgroundColor: isDark ? alpha("#fff", 0.14) : alpha("#37352F", 0.18),
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
        styleOverrides: { root: { transition: "height 200ms cubic-bezier(0.4, 0, 0.2, 1)" } },
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
          "::-webkit-scrollbar": { width: 5, height: 5 },
          "::-webkit-scrollbar-track": { backgroundColor: "transparent" },
          "::-webkit-scrollbar-thumb": {
            backgroundColor: isDark ? alpha("#fff", 0.1) : alpha("#000", 0.12),
            borderRadius: 3,
          },
          "::-webkit-scrollbar-thumb:hover": {
            backgroundColor: isDark ? alpha("#fff", 0.18) : alpha("#000", 0.22),
          },
          "::selection": {
            backgroundColor: alpha(G8.orange, 0.25),
            color: isDark ? "rgba(255,255,255,0.9)" : "#37352F",
          },
        },
      },
    },
  });

  return responsiveFontSizes(theme, { factor: 1.2 });
}
