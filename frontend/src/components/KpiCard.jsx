import { Box, Card, CardContent, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

// Default to CSB yellow
export default function KpiCard({ title, value, subtitle, color = "#E9FF52" }) {
  return (
    <Card
      sx={{
        position: "relative",
        overflow: "hidden",
        cursor: "default",
        transition: "transform 220ms cubic-bezier(0.16,1,0.3,1), box-shadow 220ms ease, border-color 220ms ease",
        // 4-layer shadow — very deep on dark bg
        boxShadow: (t) => t.palette.mode === "dark"
          ? `0 1px 3px rgba(0,0,0,0.95), 0 4px 16px rgba(0,0,0,0.82), 0 12px 40px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04)`
          : `0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.05), 0 12px 40px rgba(0,0,0,0.03), 0 0 0 1px rgba(0,0,0,0.05)`,
        "&:hover": {
          transform: "translateY(-4px)",
          borderColor: alpha(color, 0.35),
          // 5-layer with neon yellow glow
          boxShadow: (t) => t.palette.mode === "dark"
            ? `0 2px 6px rgba(0,0,0,0.95), 0 8px 28px rgba(0,0,0,0.85), 0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px ${alpha(color, 0.3)}, 0 0 40px ${alpha(color, 0.08)}`
            : `0 2px 6px rgba(0,0,0,0.08), 0 8px 28px rgba(0,0,0,0.06), 0 24px 64px rgba(0,0,0,0.04), 0 0 0 1px ${alpha(color, 0.25)}, 0 0 32px ${alpha(color, 0.06)}`,
        },
      }}
    >
      {/* Top-right glow orb */}
      <Box sx={{
        position: "absolute",
        top: -50, right: -50,
        width: 140, height: 140,
        borderRadius: "50%",
        background: `radial-gradient(circle, ${alpha(color, 0.15)} 0%, transparent 70%)`,
        pointerEvents: "none",
        transition: "opacity 220ms",
      }} />

      {/* Bottom-left ambient */}
      <Box sx={{
        position: "absolute",
        bottom: -30, left: -20,
        width: 100, height: 100,
        borderRadius: "50%",
        background: `radial-gradient(circle, ${alpha(color, 0.07)} 0%, transparent 70%)`,
        pointerEvents: "none",
      }} />

      {/* Left accent bar — neon yellow glow */}
      <Box sx={{
        position: "absolute",
        top: 0, left: 0, bottom: 0,
        width: 3,
        background: `linear-gradient(180deg, ${color} 0%, ${alpha(color, 0.18)} 100%)`,
        boxShadow: `0 0 10px ${alpha(color, 0.55)}, 0 0 22px ${alpha(color, 0.2)}`,
        borderRadius: "10px 0 0 10px",
        opacity: 0.9,
      }} />

      <CardContent sx={{ position: "relative", pt: 2.2, pb: "20px !important", pl: "22px !important" }}>
        {/* Category label */}
        <Typography variant="overline" sx={{
          display: "block", mb: 1.2,
          fontSize: "0.65rem",
          letterSpacing: "0.1em",
          color: "text.secondary",
        }}>
          {title}
        </Typography>

        {/* Big number */}
        <Typography sx={{
          fontSize: "clamp(1.6rem, 3vw, 2.1rem)",
          fontWeight: 700,
          letterSpacing: "-0.04em",
          lineHeight: 1.05,
          color: "text.primary",
          mb: 1.4,
        }}>
          {value}
        </Typography>

        {/* Accent line + subtitle */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
          <Box sx={{
            width: 20, height: 2, borderRadius: 1, flexShrink: 0,
            background: `linear-gradient(90deg, ${color} 0%, ${alpha(color, 0.18)} 100%)`,
            boxShadow: `0 0 8px ${alpha(color, 0.6)}, 0 0 16px ${alpha(color, 0.2)}`,
          }} />
          <Typography variant="caption" sx={{ fontSize: "0.75rem", color: "text.secondary", lineHeight: 1.3 }}>
            {subtitle}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}
