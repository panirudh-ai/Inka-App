import { Box, Card, CardContent, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

export default function KpiCard({ title, value, subtitle, color = "#dc5648" }) {
  return (
    <Card
      sx={{
        position: "relative",
        overflow: "hidden",
        cursor: "default",
        transition: "transform 300ms cubic-bezier(.66,0,.34,1), box-shadow 300ms cubic-bezier(.66,0,.34,1), border-color 300ms",
        "&:hover": {
          transform: "translateY(-3px)",
          borderColor: alpha(color, 0.35),
          boxShadow: (t) =>
            t.palette.mode === "dark"
              ? `0 8px 32px rgba(0,0,0,0.55), 0 0 0 1px ${alpha(color, 0.2)}`
              : `0 8px 24px rgba(30,31,31,0.12), 0 0 0 1px ${alpha(color, 0.15)}`,
        },
      }}
    >
      {/* Glow orb — top right */}
      <Box
        sx={{
          position: "absolute",
          top: -40,
          right: -40,
          width: 120,
          height: 120,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${alpha(color, 0.18)} 0%, transparent 70%)`,
          pointerEvents: "none",
          transition: "opacity 300ms",
        }}
      />

      <CardContent sx={{ position: "relative", pt: 2.2, pb: "20px !important" }}>
        {/* Category label */}
        <Typography
          variant="overline"
          sx={{
            display: "block",
            mb: 1.2,
            fontSize: "0.65rem",
            letterSpacing: "0.12em",
            color: "text.secondary",
          }}
        >
          {title}
        </Typography>

        {/* Big number */}
        <Typography
          sx={{
            fontSize: "clamp(1.6rem, 3vw, 2rem)",
            fontWeight: 700,
            letterSpacing: "-0.03em",
            lineHeight: 1.1,
            color: "text.primary",
            mb: 1.4,
            fontFamily: '"DM Serif Display", Georgia, serif',
          }}
        >
          {value}
        </Typography>

        {/* Bottom line with colour indicator */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
          <Box
            sx={{
              width: 20,
              height: 2,
              borderRadius: 1,
              background: `linear-gradient(90deg, ${color} 0%, ${alpha(color, 0.3)} 100%)`,
              flexShrink: 0,
            }}
          />
          <Typography
            variant="caption"
            sx={{ fontSize: "0.75rem", color: "text.secondary", lineHeight: 1.3 }}
          >
            {subtitle}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}
