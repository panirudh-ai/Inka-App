import { createTheme, responsiveFontSizes, alpha } from "@mui/material/styles";

// ── CodeSandbox-accurate design tokens ───────────────────────────────────────
// CSB palette: neon yellow #E9FF52 + ash grays on deep-dark backgrounds
export const G8 = {
  // Deep dark — CSB exact backgrounds
  black:   "#151515",   // CSB body bg
  black2:  "#1C1C1C",   // CSB panel / card
  black3:  "#252525",   // CSB elevated surface
  black4:  "#2E2E2E",   // CSB more elevated
  gray:    "#3A3A3A",   // borders / dividers (opaque)

  // Ash text scale — CSB's gray palette
  offWhite: "#EBEBEB",          // primary text
  muted:    "#808080",          // secondary / ash
  dim:      "#555555",          // placeholder / disabled

  // Light palette (for light mode)
  cream:   "#FFFFFF",
  cream2:  "#F5F5F5",
  cream3:  "#EBEBEB",

  // CSB Signature Yellow — THE brand accent
  orange:      "#E9FF52",   // neon yellow (primary)  contrastText = #151515
  orangeDim:   "#C8D900",   // hover / darker yellow
  orangeLight: "#F2FF85",   // tint / lighter yellow

  // Ash accent for secondary roles / info
  purple:     "#A0A0A0",    // ash silver (secondary accent)
  purpleDark: "#686868",

  // Borders
  warmBorder:  "rgba(0,0,0,0.09)",
  warmBorder2: "rgba(0,0,0,0.16)",
  darkBorder:  "rgba(255,255,255,0.06)",
  darkBorder2: "rgba(255,255,255,0.11)",

  // Overlay
  overlay: "rgba(0,0,0,0.85)",
};

// ── Shadow system — deep dark with yellow neon glows ─────────────────────────
const mkShadow = (dark) => dark
  ? {
      xs:  `0 1px 2px rgba(0,0,0,0.9),  0 0 0 1px rgba(255,255,255,0.04)`,
      sm:  `0 1px 4px rgba(0,0,0,0.82), 0 4px 16px rgba(0,0,0,0.6),  0 0 0 1px rgba(255,255,255,0.045)`,
      md:  `0 2px 8px rgba(0,0,0,0.85), 0 8px 32px rgba(0,0,0,0.62), 0 20px 56px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.05)`,
      lg:  `0 4px 16px rgba(0,0,0,0.88),0 16px 56px rgba(0,0,0,0.68),0 40px 96px rgba(0,0,0,0.4),  0 0 0 1px rgba(255,255,255,0.055)`,
      xl:  `0 8px 32px rgba(0,0,0,0.9), 0 32px 96px rgba(0,0,0,0.72),0 72px 140px rgba(0,0,0,0.45),0 0 0 1px rgba(255,255,255,0.06)`,
      accent: `0 2px 12px ${alpha(G8.orange, 0.55)}, 0 8px 28px ${alpha(G8.orange, 0.2)}, 0 0 0 1px ${alpha(G8.orange, 0.35)}`,
      inset:  `inset 0 1px 4px rgba(0,0,0,0.55), inset 0 0 0 1px rgba(0,0,0,0.3)`,
    }
  : {
      xs:  `0 1px 2px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.05)`,
      sm:  `0 1px 4px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.05)`,
      md:  `0 2px 8px rgba(0,0,0,0.09), 0 8px 32px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.06)`,
      lg:  `0 4px 16px rgba(0,0,0,0.1), 0 16px 56px rgba(0,0,0,0.08),0 0 0 1px rgba(0,0,0,0.07)`,
      xl:  `0 8px 32px rgba(0,0,0,0.12),0 32px 96px rgba(0,0,0,0.09),0 0 0 1px rgba(0,0,0,0.08)`,
      accent: `0 2px 12px ${alpha(G8.orangeDim, 0.35)}, 0 8px 28px ${alpha(G8.orangeDim, 0.14)}, 0 0 0 1px ${alpha(G8.orangeDim, 0.2)}`,
      inset:  `inset 0 1px 4px rgba(0,0,0,0.06), inset 0 0 0 1px rgba(0,0,0,0.04)`,
    };

export function buildTheme(mode = "dark") {
  const isDark  = mode === "dark";
  const sh      = mkShadow(isDark);

  const bg       = isDark ? G8.black   : G8.cream;
  const surface  = isDark ? G8.black2  : G8.cream;
  const surface2 = isDark ? G8.black3  : G8.cream2;
  const border   = isDark ? G8.darkBorder  : G8.warmBorder;
  const border2  = isDark ? G8.darkBorder2 : G8.warmBorder2;
  const text     = isDark ? G8.offWhite : "#1A1A1A";
  const muted    = isDark ? G8.muted    : "#666666";
  const hover    = isDark ? alpha("#fff", 0.05) : alpha("#000", 0.04);

  // CSB yellow on dark text (inverse for primary button)
  const yellowText = "#151515";

  const theme = createTheme({
    palette: {
      mode,
      // Yellow as primary — dark text on yellow bg (CSB style)
      primary: {
        main:          G8.orange,
        light:         G8.orangeLight,
        dark:          G8.orangeDim,
        contrastText:  yellowText,
      },
      secondary: {
        main:         isDark ? G8.offWhite : "#1A1A1A",
        contrastText: isDark ? "#151515"   : "#fff",
      },
      success:   { main: "#57C97A", light: "rgba(87,201,122,0.12)" },
      error:     { main: "#F87171", light: "rgba(248,113,113,0.12)" },
      warning:   { main: G8.orange, light: alpha(G8.orange, 0.12) },
      info:      { main: "#6E9EFF", light: "rgba(110,158,255,0.12)" },
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
      // CSB uses Inter — clean, tight, developer-feel
      fontFamily: '"Inter", ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontWeightLight:   300,
      fontWeightRegular: 400,
      fontWeightMedium:  500,
      fontWeightBold:    600,
      h1: { fontSize: "clamp(1.75rem, 3.5vw, 2.25rem)", fontWeight: 700, letterSpacing: "-0.04em",  lineHeight: 1.15, color: text },
      h2: { fontSize: "clamp(1.4rem,  2.8vw, 1.75rem)", fontWeight: 700, letterSpacing: "-0.03em",  lineHeight: 1.2,  color: text },
      h3: { fontSize: "clamp(1.1rem,  2vw,   1.35rem)", fontWeight: 600, letterSpacing: "-0.025em", lineHeight: 1.3,  color: text },
      h4: { fontSize: "1.1rem",    fontWeight: 600, letterSpacing: "-0.02em",  color: text },
      h5: { fontSize: "0.9875rem", fontWeight: 600, letterSpacing: "-0.015em", color: text },
      h6: { fontSize: "0.9375rem", fontWeight: 600, letterSpacing: "-0.01em",  color: text },
      subtitle1: { fontSize: "0.9375rem", fontWeight: 500, lineHeight: 1.55 },
      subtitle2: { fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: muted },
      body1:   { fontSize: "0.9375rem", fontWeight: 400, lineHeight: 1.65, color: text },
      body2:   { fontSize: "0.875rem",  fontWeight: 400, lineHeight: 1.6,  color: muted },
      caption: { fontSize: "0.8125rem", fontWeight: 400, color: muted, lineHeight: 1.5 },
      overline: { fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: muted },
      button:   { fontSize: "0.875rem",  fontWeight: 600, letterSpacing: "-0.01em" },
    },

    shape: { borderRadius: 8 },

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
              ? alpha(G8.black2, 0.94)
              : alpha(G8.cream, 0.95),
            backgroundImage: "none",
            backdropFilter: "blur(24px) saturate(180%)",
            WebkitBackdropFilter: "blur(24px) saturate(180%)",
            borderBottom: `1px solid ${border}`,
            boxShadow: isDark
              ? `0 1px 0 rgba(255,255,255,0.04), 0 4px 24px rgba(0,0,0,0.6)`
              : `0 1px 0 rgba(0,0,0,0.07), 0 4px 24px rgba(0,0,0,0.04)`,
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
            backgroundColor: isDark ? G8.black2 : G8.cream,
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
            borderRadius: 10,
            transition: "box-shadow 220ms ease, transform 220ms ease, border-color 220ms ease",
            "&:hover": {
              boxShadow: isDark
                ? `${sh.md}, 0 0 0 1px ${alpha(G8.orange, 0.2)}`
                : `${sh.md}, 0 0 0 1px ${alpha(G8.orangeDim, 0.18)}`,
              borderColor: isDark
                ? alpha(G8.orange, 0.25)
                : alpha(G8.orangeDim, 0.2),
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
            fontWeight: 600,
            borderRadius: 8,
            letterSpacing: "-0.01em",
            transition: "all 150ms cubic-bezier(0.16,1,0.3,1)",
            "&:focus-visible": {
              outline: `2px solid ${G8.orange}`,
              outlineOffset: 2,
              boxShadow: `0 0 0 4px ${alpha(G8.orange, 0.25)}`,
            },
          },
          sizeSmall:  { fontSize: "0.8125rem", padding: "4px 12px",  height: 30 },
          sizeMedium: { fontSize: "0.875rem",  padding: "6px 16px",  height: 36 },
          sizeLarge:  { fontSize: "0.9rem",    padding: "9px 22px",  height: 42 },
          // Yellow button — dark text on neon yellow (CSB exact style)
          containedPrimary: {
            backgroundColor: G8.orange,
            color: yellowText,
            boxShadow: `0 1px 3px ${alpha(G8.orange, 0.4)}, inset 0 1px 0 ${alpha("#fff", 0.2)}`,
            "&:hover": {
              backgroundColor: G8.orangeDim,
              boxShadow: `0 2px 12px ${alpha(G8.orange, 0.55)}, 0 6px 24px ${alpha(G8.orange, 0.22)}, inset 0 1px 0 ${alpha("#fff", 0.15)}`,
              transform: "translateY(-1px)",
            },
            "&:active": { transform: "translateY(0)", boxShadow: "none" },
          },
          containedSecondary: {
            backgroundColor: isDark ? alpha("#fff", 0.08) : alpha("#1A1A1A", 0.06),
            color: text,
            border: `1px solid ${border2}`,
            boxShadow: sh.xs,
            "&:hover": {
              backgroundColor: isDark ? alpha("#fff", 0.13) : alpha("#1A1A1A", 0.1),
              boxShadow: sh.sm,
              transform: "translateY(-1px)",
            },
          },
          outlined: {
            borderColor: border2,
            color: text,
            backgroundColor: "transparent",
            boxShadow: sh.xs,
            "&:hover": {
              borderColor: G8.orange,
              color: isDark ? G8.orange : G8.orangeDim,
              backgroundColor: alpha(G8.orange, 0.06),
              boxShadow: `0 0 0 1px ${alpha(G8.orange, 0.3)}, 0 2px 8px ${alpha(G8.orange, 0.15)}`,
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
            transition: "all 150ms ease",
            "&:hover": {
              color: G8.orange,
              backgroundColor: alpha(G8.orange, 0.08),
            },
          },
        },
      },

      // ── Inputs ──────────────────────────────────────────────────────────
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            backgroundColor: isDark ? alpha("#000", 0.35) : alpha("#000", 0.02),
            fontSize: "0.9375rem",
            color: text,
            transition: "box-shadow 160ms ease",
            boxShadow: sh.inset,
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: border2,
              transition: "border-color 160ms",
            },
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: alpha(G8.orange, 0.45),
            },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: G8.orange,
              borderWidth: 1.5,
            },
            "&.Mui-focused": {
              boxShadow: `0 0 0 3px ${alpha(G8.orange, 0.18)}, 0 0 16px ${alpha(G8.orange, 0.08)}, ${sh.inset}`,
            },
          },
          input: {
            padding: "8px 12px",
            "&::placeholder": { color: G8.dim, opacity: 1 },
          },
          sizeSmall: { "& input": { padding: "6px 10px" } },
        },
      },

      MuiInputLabel: {
        styleOverrides: {
          root: { fontSize: "0.875rem", color: muted },
          shrunk: { fontSize: "0.8125rem", fontWeight: 500, color: isDark ? G8.offWhite : "#1A1A1A" },
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
            borderRadius: 6,
            "&:hover": { backgroundColor: hover },
            "&.Mui-selected": {
              backgroundColor: alpha(G8.orange, isDark ? 0.12 : 0.08),
              color: isDark ? G8.orange : G8.orangeDim,
              "&:hover": { backgroundColor: alpha(G8.orange, isDark ? 0.18 : 0.12) },
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
            boxShadow: sh.sm,
            backgroundColor: isDark ? alpha(G8.black2, 0.8) : G8.cream,
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
              backgroundColor: isDark ? alpha(G8.black, 0.7) : G8.cream2,
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
          root: { minHeight: 40, borderBottom: `1px solid ${border}` },
          indicator: {
            height: 2,
            backgroundColor: G8.orange,
            borderRadius: "2px 2px 0 0",
            boxShadow: `0 0 8px ${alpha(G8.orange, 0.6)}, 0 0 16px ${alpha(G8.orange, 0.2)}`,
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
            padding: "6px 16px",
            color: muted,
            letterSpacing: "-0.01em",
            transition: "color 150ms",
            "&.Mui-selected": { color: isDark ? G8.orange : G8.orangeDim, fontWeight: 600 },
            "&:hover:not(.Mui-selected)": { color: text },
          },
        },
      },

      // ── Chip ────────────────────────────────────────────────────────────
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 6,
            fontWeight: 500,
            fontSize: "0.75rem",
            height: 22,
            letterSpacing: "-0.005em",
          },
          colorPrimary: {
            backgroundColor: isDark ? alpha(G8.orange, 0.14) : alpha(G8.orangeDim, 0.1),
            color: isDark ? G8.orange : G8.orangeDim,
            boxShadow: isDark ? `0 0 0 1px ${alpha(G8.orange, 0.2)}` : undefined,
          },
          colorSuccess: { backgroundColor: "rgba(87,201,122,0.12)",  color: isDark ? "#57C97A" : "#1A7A3C" },
          colorError:   { backgroundColor: "rgba(248,113,113,0.12)", color: isDark ? "#F87171" : "#C62828" },
          colorWarning: { backgroundColor: alpha(G8.orange, 0.12),   color: isDark ? G8.orange : G8.orangeDim },
          colorInfo:    { backgroundColor: "rgba(110,158,255,0.12)", color: isDark ? "#6E9EFF" : "#2046B0" },
          colorSecondary: { backgroundColor: border, color: muted },
          outlined:  { borderColor: border2, backgroundColor: "transparent" },
          sizeSmall: { height: 20, fontSize: "0.7rem" },
          deleteIcon: { color: `${muted} !important`, "&:hover": { color: `${text} !important` } },
        },
      },

      // ── Dialog ──────────────────────────────────────────────────────────
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 12,
            border: `1px solid ${border2}`,
            backgroundColor: isDark ? G8.black2 : G8.cream,
            boxShadow: isDark
              ? `${sh.xl}, 0 0 80px ${alpha(G8.orange, 0.05)}`
              : sh.xl,
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
            letterSpacing: "-0.015em",
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
          root: {
            backgroundColor: alpha("#000", 0.78),
            backdropFilter: "blur(8px)",
          },
        },
      },

      // ── Accordion ───────────────────────────────────────────────────────
      MuiAccordion: {
        defaultProps: { disableGutters: true, elevation: 0 },
        styleOverrides: {
          root: {
            border: `1px solid ${border}`,
            borderRadius: "10px !important",
            backgroundColor: isDark ? G8.black2 : G8.cream,
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
            boxShadow: sh.xs,
          },
          standardSuccess: { backgroundColor: "rgba(87,201,122,0.1)",  color: isDark ? "#57C97A" : "#1A7A3C", borderColor: "rgba(87,201,122,0.2)" },
          standardError:   { backgroundColor: "rgba(248,113,113,0.1)", color: isDark ? "#F87171" : "#C62828", borderColor: "rgba(248,113,113,0.2)" },
          standardWarning: { backgroundColor: alpha(G8.orange, 0.1),   color: isDark ? G8.orange : G8.orangeDim, borderColor: alpha(G8.orange, 0.2) },
          standardInfo:    { backgroundColor: "rgba(110,158,255,0.1)", color: isDark ? "#6E9EFF" : "#2046B0", borderColor: "rgba(110,158,255,0.2)" },
        },
      },

      MuiSnackbar: {
        defaultProps: { anchorOrigin: { vertical: "bottom", horizontal: "right" } },
      },

      // ── Tooltip ─────────────────────────────────────────────────────────
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            backgroundColor: isDark ? G8.black3 : "#1A1A1A",
            color: G8.offWhite,
            fontSize: "0.75rem",
            borderRadius: 6,
            padding: "5px 10px",
            boxShadow: sh.md,
            border: `1px solid ${border}`,
          },
          arrow: { color: isDark ? G8.black3 : "#1A1A1A" },
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
              "& + .MuiSwitch-track": {
                opacity: 1,
                backgroundColor: G8.orange,
                boxShadow: `0 0 8px ${alpha(G8.orange, 0.5)}`,
              },
            },
          },
          thumb: {
            width: 16, height: 16,
            boxShadow: "0 1px 4px rgba(0,0,0,0.5)",
            backgroundColor: isDark ? G8.offWhite : "#fff",
          },
          track: {
            borderRadius: 11,
            backgroundColor: isDark ? alpha("#fff", 0.12) : alpha("#1A1A1A", 0.18),
            opacity: 1,
            transition: "background 250ms",
          },
        },
      },

      MuiFormControlLabel: {
        styleOverrides: {
          label: { fontSize: "0.875rem", color: text },
        },
      },

      MuiCircularProgress: {
        defaultProps: { size: 24, thickness: 3.5 },
        styleOverrides: { colorPrimary: { color: isDark ? G8.orange : G8.orangeDim } },
      },

      MuiCollapse: {
        styleOverrides: { root: { transition: "height 200ms cubic-bezier(0.4,0,0.2,1)" } },
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
            backgroundColor: alpha(G8.orange, isDark ? 0.3 : 0.2),
            color: isDark ? "#151515" : "#1A1A1A",
          },
        },
      },
    },
  });

  return responsiveFontSizes(theme, { factor: 1.2 });
}
