import { Box, Card, CardContent, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

export default function KpiCard({ title, value, subtitle, color = "#635BFF" }) {
  return (
    <Card
      sx={{
        position: "relative",
        overflow: "hidden",
        transition: "box-shadow 200ms, transform 200ms",
        "&:hover": {
          boxShadow: `0 4px 20px ${alpha(color, 0.18)}, 0 1px 4px rgba(10,37,64,0.06)`,
          transform: "translateY(-1px)",
        },
      }}
    >
      {/* Top accent line */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          borderRadius: "10px 10px 0 0",
          background: `linear-gradient(90deg, ${color} 0%, ${alpha(color, 0.4)} 100%)`,
        }}
      />

      <CardContent sx={{ pt: 2.2, pb: "18px !important" }}>
        {/* Label */}
        <Typography
          variant="overline"
          sx={{ color: "text.secondary", fontSize: "0.7rem", letterSpacing: "0.07em", display: "block", mb: 0.8 }}
        >
          {title}
        </Typography>

        {/* Value */}
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            fontSize: { xs: "1.5rem", md: "1.75rem" },
            color: "text.primary",
            letterSpacing: "-0.02em",
            lineHeight: 1.2,
            mb: 0.8,
          }}
        >
          {value}
        </Typography>

        {/* Subtitle with colour dot */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.6 }}>
          <Box
            sx={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              bgcolor: color,
              flexShrink: 0,
            }}
          />
          <Typography variant="caption" sx={{ color: "text.secondary", lineHeight: 1.4 }}>
            {subtitle}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}
