import { Card, CardContent, Typography, Box } from "@mui/material";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";

export default function KpiCard({ title, value, subtitle, color = "#0f766e" }) {
  return (
    <Card sx={{ position: "relative", overflow: "hidden" }}>
      <Box
        sx={{
          position: "absolute",
          right: -16,
          top: -16,
          width: 92,
          height: 92,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${color}55 0%, transparent 70%)`,
          transition: "transform 260ms ease",
          ":hover": { transform: "scale(1.08)" },
        }}
      />
      <CardContent>
        <Typography variant="body2" color="text.secondary">{title}</Typography>
        <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5 }}>{value}</Typography>
        <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
          <TrendingUpIcon sx={{ fontSize: 16, color }} />
          <Typography variant="caption" sx={{ ml: 0.5 }}>{subtitle}</Typography>
        </Box>
      </CardContent>
    </Card>
  );
}
