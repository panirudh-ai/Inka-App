import { createTheme, responsiveFontSizes, alpha } from "@mui/material/styles";

// ── Stripe-inspired design tokens ───────────────────────────────────────────
const STRIPE = {
  // brand
  indigo:      "#635BFF",
  indigoDark:  "#4F46E5",
  indigoLight: "#7C74FF",
  indigoGhost: "#EEF2FF",
  // neutrals – light
  navy:        "#0A2540",
  ink:         "#1A1F36",
  slate:       "#425466",
  muted:       "#697386",
  border:      "#E3E8EF",
  borderHover: "#C1CCE4",
  surface:     "#FFFFFF",
  bg:          "#F6F9FC",
  bgHover:     "#F0F4F9",
  // status
  green:       "#1A9E5D",
  greenBg:     "#ECFDF5",
  red:         "#DF1B41",
  redBg:       "#FFF1F3",
  amber:       "#B7791F",
  amberBg:     "#FFFBEB",
  blue:        "#0073E6",
  blueBg:      "#EFF6FF",
  // dark mode
  darkBg:      "#0D1B2E",
  darkSurface: "#0F2240",
  darkSurface2:"#162B47",
  darkBorder:  "#1E3A5F",
  darkText:    "#C9D7E8",
  darkMuted:   "#7B93AE",
};

// ── Shared shadows ───────────────────────────────────────────────────────────
const shadow = {
  xs:  "0 1px 2px rgba(10,37,64,0.06)",
  sm:  "0 1px 4px rgba(10,37,64,0.07), 0 1px 2px rgba(10,37,64,0.04)",
  md:  "0 4px 12px rgba(10,37,64,0.09), 0 1px 3px rgba(10,37,64,0.05)",
  lg:  "0 8px 24px rgba(10,37,64,0.10), 0 2px 6px rgba(10,37,64,0.05)",
  xl:  "0 16px 40px rgba(10,37,64,0.12), 0 4px 12px rgba(10,37,64,0.06)",
  indigoSm: "0 4px 14px rgba(99,91,255,0.25)",
};

const shadowDark = {
  xs:  "0 1px 2px rgba(0,0,0,0.3)",
  sm:  "0 1px 4px rgba(0,0,0,0.35), 0 1px 2px rgba(0,0,0,0.2)",
  md:  "0 4px 12px rgba(0,0,0,0.4), 0 1px 3px rgba(0,0,0,0.25)",
  lg:  "0 8px 24px rgba(0,0,0,0.45), 0 2px 6px rgba(0,0,0,0.3)",
  xl:  "0 16px 40px rgba(0,0,0,0.5), 0 4px 12px rgba(0,0,0,0.35)",
};

export function buildTheme(mode = "light") {
  const isDark = mode === "dark";
  const S = isDark ? {
    primary:    STRIPE.indigoLight,
    bg:         STRIPE.darkBg,
    surface:    STRIPE.darkSurface,
    surface2:   STRIPE.darkSurface2,
    border:     STRIPE.darkBorder,
    text:       STRIPE.darkText,
    muted:      STRIPE.darkMuted,
    hover:      alpha("#FFFFFF", 0.04),
    shadow:     shadowDark,
  } : {
    primary:    STRIPE.indigo,
    bg:         STRIPE.bg,
    surface:    STRIPE.surface,
    surface2:   STRIPE.bgHover,
    border:     STRIPE.border,
    text:       STRIPE.ink,
    muted:      STRIPE.muted,
    hover:      STRIPE.bgHover,
    shadow:     shadow,
  };

  const theme = createTheme({
    palette: {
      mode,
      primary:   { main: S.primary, contrastText: "#FFFFFF" },
      secondary: { main: isDark ? "#38BDF8" : "#0073E6", contrastText: "#FFFFFF" },
      success:   { main: STRIPE.green,  light: STRIPE.greenBg },
      error:     { main: STRIPE.red,    light: STRIPE.redBg   },
      warning:   { main: STRIPE.amber,  light: STRIPE.amberBg },
      info:      { main: STRIPE.blue,   light: STRIPE.blueBg  },
      background: {
        default: S.bg,
        paper:   S.surface,
      },
      text: {
        primary:   S.text,
        secondary: S.muted,
        disabled:  alpha(S.text, 0.38),
      },
      divider: S.border,
    },

    typography: {
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, sans-serif',
      fontWeightLight:   300,
      fontWeightRegular: 400,
      fontWeightMedium:  500,
      fontWeightBold:    600,
      h1: { fontSize: "2rem",   fontWeight: 700, color: isDark ? S.text : STRIPE.navy, letterSpacing: "-0.02em", lineHeight: 1.25 },
      h2: { fontSize: "1.625rem", fontWeight: 700, color: isDark ? S.text : STRIPE.navy, letterSpacing: "-0.015em", lineHeight: 1.3 },
      h3: { fontSize: "1.375rem", fontWeight: 700, color: isDark ? S.text : STRIPE.navy, letterSpacing: "-0.01em" },
      h4: { fontSize: "1.25rem",  fontWeight: 700, color: isDark ? S.text : STRIPE.navy, letterSpacing: "-0.01em" },
      h5: { fontSize: "1.125rem", fontWeight: 600, color: isDark ? S.text : STRIPE.navy },
      h6: { fontSize: "1rem",     fontWeight: 600, color: isDark ? S.text : STRIPE.navy },
      subtitle1: { fontSize: "0.9375rem", fontWeight: 500, lineHeight: 1.5 },
      subtitle2: { fontSize: "0.8125rem", fontWeight: 600, letterSpacing: "0.01em", textTransform: "uppercase", color: S.muted },
      body1: { fontSize: "0.9375rem", fontWeight: 400, lineHeight: 1.6 },
      body2: { fontSize: "0.875rem",  fontWeight: 400, lineHeight: 1.55 },
      caption: { fontSize: "0.8125rem", fontWeight: 400, color: S.muted, lineHeight: 1.5 },
      overline: { fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: S.muted },
      button: { fontSize: "0.875rem", fontWeight: 500, letterSpacing: "0.01em" },
    },

    shape: { borderRadius: 8 },

    shadows: [
      "none",
      S.shadow.xs,
      S.shadow.sm,
      S.shadow.md,
      S.shadow.md,
      S.shadow.lg,
      S.shadow.lg,
      S.shadow.lg,
      S.shadow.xl,
      S.shadow.xl,
      S.shadow.xl,
      S.shadow.xl,
      S.shadow.xl,
      S.shadow.xl,
      S.shadow.xl,
      S.shadow.xl,
      S.shadow.xl,
      S.shadow.xl,
      S.shadow.xl,
      S.shadow.xl,
      S.shadow.xl,
      S.shadow.xl,
      S.shadow.xl,
      S.shadow.xl,
      S.shadow.xl,
    ],

    components: {
      // ── AppBar ──────────────────────────────────────────────────────────
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: isDark ? STRIPE.darkSurface : STRIPE.surface,
            backgroundImage: "none",
            borderBottom: `1px solid ${S.border}`,
            boxShadow: "none",
            color: S.text,
          },
        },
      },

      // ── Paper / Card ────────────────────────────────────────────────────
      MuiPaper: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: {
            backgroundImage: "none",
            backgroundColor: S.surface,
            border: `1px solid ${S.border}`,
            boxShadow: S.shadow.sm,
          },
          elevation0: { boxShadow: "none", border: `1px solid ${S.border}` },
          elevation1: { boxShadow: S.shadow.xs },
          elevation2: { boxShadow: S.shadow.sm },
          elevation3: { boxShadow: S.shadow.md },
        },
      },

      MuiCard: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: {
            backgroundImage: "none",
            backgroundColor: S.surface,
            border: `1px solid ${S.border}`,
            boxShadow: S.shadow.sm,
            borderRadius: 10,
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
            letterSpacing: "0.01em",
            transition: "background 150ms, box-shadow 150ms, border-color 150ms",
            "&:focus-visible": { outline: `2px solid ${S.primary}`, outlineOffset: 2 },
          },
          sizeSmall:  { fontSize: "0.8125rem", padding: "4px 10px",  height: 30 },
          sizeMedium: { fontSize: "0.875rem",  padding: "7px 14px",  height: 36 },
          sizeLarge:  { fontSize: "0.9375rem", padding: "10px 20px", height: 42 },
          contained: {
            boxShadow: "none",
            "&:hover": { boxShadow: "none", filter: "brightness(0.92)" },
            "&:active": { transform: "translateY(1px)" },
          },
          containedPrimary: {
            background: isDark
              ? `linear-gradient(180deg, ${STRIPE.indigoLight} 0%, ${STRIPE.indigo} 100%)`
              : `linear-gradient(180deg, #7B73FF 0%, ${STRIPE.indigo} 100%)`,
            "&:hover": {
              background: isDark
                ? `linear-gradient(180deg, #9190FF 0%, ${STRIPE.indigoLight} 100%)`
                : `linear-gradient(180deg, ${STRIPE.indigo} 0%, ${STRIPE.indigoDark} 100%)`,
            },
          },
          outlined: {
            borderColor: S.border,
            color: S.text,
            backgroundColor: S.surface,
            "&:hover": { backgroundColor: S.hover, borderColor: S.primary },
          },
          text: {
            color: S.primary,
            "&:hover": { backgroundColor: isDark ? alpha(S.primary, 0.1) : STRIPE.indigoGhost },
          },
        },
      },

      MuiIconButton: {
        styleOverrides: {
          root: {
            borderRadius: 6,
            "&:hover": { backgroundColor: S.hover },
          },
        },
      },

      // ── Inputs ──────────────────────────────────────────────────────────
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 6,
            backgroundColor: isDark ? alpha("#FFFFFF", 0.03) : STRIPE.surface,
            fontSize: "0.875rem",
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: S.border,
              transition: "border-color 150ms",
            },
            "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: S.primary },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: S.primary,
              borderWidth: 2,
              boxShadow: `0 0 0 3px ${alpha(S.primary, 0.15)}`,
            },
          },
          input: { padding: "8px 12px" },
          sizeSmall: { "& input": { padding: "6px 10px" } },
        },
      },

      MuiInputLabel: {
        styleOverrides: {
          root: { fontSize: "0.875rem", color: S.muted },
          shrunk: { fontSize: "0.8125rem", fontWeight: 500 },
        },
      },

      MuiFormHelperText: {
        styleOverrides: { root: { fontSize: "0.75rem", marginTop: 4 } },
      },

      MuiSelect: {
        styleOverrides: {
          select: { fontSize: "0.875rem", padding: "8px 12px" },
        },
      },

      // ── Table ───────────────────────────────────────────────────────────
      MuiTableContainer: {
        styleOverrides: {
          root: { borderRadius: 8, border: `1px solid ${S.border}`, boxShadow: "none" },
        },
      },

      MuiTable: {
        styleOverrides: { root: { borderCollapse: "collapse" } },
      },

      MuiTableHead: {
        styleOverrides: {
          root: {
            backgroundColor: isDark ? S.surface2 : STRIPE.bg,
            "& .MuiTableCell-head": {
              color: S.muted,
              fontWeight: 600,
              fontSize: "0.75rem",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              borderBottom: `1px solid ${S.border}`,
              padding: "10px 16px",
            },
          },
        },
      },

      MuiTableBody: {
        styleOverrides: {
          root: {
            "& .MuiTableRow-root": {
              transition: "background 100ms",
              "&:hover": { backgroundColor: isDark ? S.hover : STRIPE.bgHover },
              "&:last-child .MuiTableCell-body": { borderBottom: "none" },
            },
          },
        },
      },

      MuiTableCell: {
        styleOverrides: {
          root: {
            borderBottom: `1px solid ${S.border}`,
            padding: "11px 16px",
            fontSize: "0.875rem",
            color: S.text,
          },
        },
      },

      MuiTableRow: {
        styleOverrides: {
          root: { "&.Mui-selected": { backgroundColor: isDark ? alpha(S.primary, 0.15) : STRIPE.indigoGhost } },
        },
      },

      // ── Tabs ────────────────────────────────────────────────────────────
      MuiTabs: {
        styleOverrides: {
          root: { minHeight: 40 },
          indicator: {
            height: 2,
            borderRadius: "2px 2px 0 0",
            backgroundColor: S.primary,
          },
        },
      },

      MuiTab: {
        styleOverrides: {
          root: {
            textTransform: "none",
            fontWeight: 500,
            fontSize: "0.875rem",
            minHeight: 40,
            padding: "8px 14px",
            color: S.muted,
            "&.Mui-selected": { color: S.primary, fontWeight: 600 },
            "&:hover": { color: S.text },
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
          },
          colorPrimary: {
            backgroundColor: isDark ? alpha(S.primary, 0.2) : STRIPE.indigoGhost,
            color: S.primary,
          },
          colorSuccess: {
            backgroundColor: STRIPE.greenBg,
            color: STRIPE.green,
          },
          colorError: {
            backgroundColor: STRIPE.redBg,
            color: STRIPE.red,
          },
          colorWarning: {
            backgroundColor: STRIPE.amberBg,
            color: STRIPE.amber,
          },
          colorInfo: {
            backgroundColor: STRIPE.blueBg,
            color: STRIPE.blue,
          },
          outlined: {
            borderRadius: 4,
            borderColor: S.border,
            backgroundColor: "transparent",
          },
          sizeSmall: { height: 20, fontSize: "0.7rem" },
        },
      },

      // ── Dialog ──────────────────────────────────────────────────────────
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 12,
            boxShadow: S.shadow.xl,
            border: `1px solid ${S.border}`,
          },
        },
      },

      MuiDialogTitle: {
        styleOverrides: {
          root: {
            fontSize: "1rem",
            fontWeight: 600,
            padding: "20px 24px 12px",
            color: isDark ? S.text : STRIPE.navy,
            borderBottom: `1px solid ${S.border}`,
          },
        },
      },

      MuiDialogContent: {
        styleOverrides: { root: { padding: "20px 24px" } },
      },

      MuiDialogActions: {
        styleOverrides: {
          root: {
            padding: "12px 24px 20px",
            gap: 8,
            borderTop: `1px solid ${S.border}`,
          },
        },
      },

      // ── Divider ─────────────────────────────────────────────────────────
      MuiDivider: {
        styleOverrides: { root: { borderColor: S.border } },
      },

      // ── Accordion ───────────────────────────────────────────────────────
      MuiAccordion: {
        defaultProps: { disableGutters: true, elevation: 0 },
        styleOverrides: {
          root: {
            border: `1px solid ${S.border}`,
            borderRadius: "8px !important",
            backgroundColor: S.surface,
            marginBottom: 8,
            boxShadow: "none",
            "&:before": { display: "none" },
          },
        },
      },

      MuiAccordionSummary: {
        styleOverrides: {
          root: {
            minHeight: 44,
            padding: "0 16px",
            backgroundColor: isDark ? S.surface2 : STRIPE.bg,
            borderRadius: "8px 8px 0 0",
            "&.Mui-expanded": { borderBottom: `1px solid ${S.border}` },
          },
          content: { margin: "10px 0", fontWeight: 600, fontSize: "0.875rem" },
        },
      },

      MuiAccordionDetails: {
        styleOverrides: { root: { padding: "16px" } },
      },

      // ── Alert ───────────────────────────────────────────────────────────
      MuiAlert: {
        styleOverrides: {
          root: { borderRadius: 6, fontSize: "0.875rem", border: "1px solid transparent" },
          standardSuccess: { backgroundColor: STRIPE.greenBg, color: STRIPE.green, borderColor: alpha(STRIPE.green, 0.2) },
          standardError:   { backgroundColor: STRIPE.redBg,   color: STRIPE.red,   borderColor: alpha(STRIPE.red, 0.2)   },
          standardWarning: { backgroundColor: STRIPE.amberBg, color: STRIPE.amber, borderColor: alpha(STRIPE.amber, 0.2) },
          standardInfo:    { backgroundColor: STRIPE.blueBg,  color: STRIPE.blue,  borderColor: alpha(STRIPE.blue, 0.2)  },
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
            backgroundColor: isDark ? S.surface2 : STRIPE.navy,
            color: "#FFFFFF",
            fontSize: "0.75rem",
            borderRadius: 4,
            padding: "5px 10px",
            boxShadow: S.shadow.md,
          },
          arrow: { color: isDark ? S.surface2 : STRIPE.navy },
        },
      },

      // ── Switch ──────────────────────────────────────────────────────────
      MuiSwitch: {
        styleOverrides: {
          root: { width: 36, height: 20, padding: 0, margin: 6 },
          switchBase: {
            padding: 2,
            "&.Mui-checked": {
              transform: "translateX(16px)",
              "& + .MuiSwitch-track": { opacity: 1, backgroundColor: S.primary },
            },
          },
          thumb: { width: 16, height: 16, boxShadow: "none" },
          track: {
            borderRadius: 10,
            backgroundColor: isDark ? "#374151" : "#D1D5DB",
            opacity: 1,
            transition: "background 200ms",
          },
        },
      },

      // ── Collapse / transition ────────────────────────────────────────────
      MuiCollapse: {
        styleOverrides: { root: { transition: "height 200ms ease" } },
      },

      // ── FormControlLabel ─────────────────────────────────────────────────
      MuiFormControlLabel: {
        styleOverrides: {
          label: { fontSize: "0.875rem", fontWeight: 400, color: S.text },
        },
      },

      // ── Pagination / list items ──────────────────────────────────────────
      MuiListItemText: {
        styleOverrides: {
          primary: { fontSize: "0.875rem" },
          secondary: { fontSize: "0.8125rem" },
        },
      },

      MuiCircularProgress: {
        defaultProps: { size: 24, thickness: 4 },
        styleOverrides: { colorPrimary: { color: S.primary } },
      },
    },
  });

  return responsiveFontSizes(theme, { factor: 1.5 });
}
