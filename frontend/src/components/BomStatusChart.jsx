import { Box, Paper, Typography, useTheme, Tooltip, Stack } from "@mui/material";
import { useMemo } from "react";

// Ordered workflow stages — linear happy path
const STAGES = [
  { key: "Work Yet to Start",       label: "Yet to Start",   color: "#9e9e9e" },
  { key: "Position Marked",         label: "Pos Marked",     color: "#7c3aed" },
  { key: "Piping Done",             label: "Piping Done",    color: "#0ea5e9" },
  { key: "Wiring Done",             label: "Wiring Done",    color: "#3b82f6" },
  { key: "Wiring Checked OK",       label: "Wiring OK",      color: "#06b6d4" },
  { key: "Installed - To Activate", label: "To Activate",    color: "#84cc16" },
  { key: "Installed - Working",     label: "Installed ✓",    color: "#22c55e" },
];

// Problem states that break out of the main track
const PROBLEM_STATES = {
  "Wiring Rework Required":  { label: "Wiring Rework",  color: "#f97316" },
  "Provision Not Provided":  { label: "No Provision",   color: "#ef4444" },
  "Position To Be Changed":  { label: "Pos Change",     color: "#f43f5e" },
  "Installed - Not Working": { label: "Not Working",    color: "#dc2626" },
};

const STAGE_INDEX = Object.fromEntries(STAGES.map((s, i) => [s.key, i]));

// ── Single item progress row ──────────────────────────────────────────────────
export function ItemProgressRow({ item }) {
  const theme = useTheme();
  const currentIdx = STAGE_INDEX[item.status] ?? -1;
  const isProblem   = item.status in PROBLEM_STATES;
  const problemMeta = PROBLEM_STATES[item.status];

  return (
    <Box sx={{ mb: 1.5 }}>
      {/* Item name */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
        <Typography variant="caption" sx={{ fontWeight: 600, color: "text.primary", maxWidth: "65%", lineHeight: 1.3 }}>
          {item.brand_name} {item.model_number}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>
          {item.product_type_name}
        </Typography>
      </Stack>

      {/* Progress track */}
      <Box sx={{ position: "relative", display: "flex", alignItems: "center", gap: 0 }}>
        {STAGES.map((stage, idx) => {
          const isDone    = !isProblem && currentIdx > idx;
          const isCurrent = !isProblem && currentIdx === idx;
          const isFuture  = isProblem || currentIdx < idx;

          const dotColor = isDone
            ? stage.color
            : isCurrent
            ? stage.color
            : theme.palette.mode === "dark" ? "rgba(255,255,255,0.12)" : "#e0e0e0";

          const lineColor = isDone
            ? STAGES[idx].color
            : theme.palette.mode === "dark" ? "rgba(255,255,255,0.1)" : "#e0e0e0";

          return (
            <Box key={stage.key} sx={{ display: "flex", alignItems: "center", flex: idx < STAGES.length - 1 ? 1 : "none" }}>
              {/* Dot */}
              <Tooltip title={stage.label} placement="top" arrow>
                <Box
                  sx={{
                    width:  isCurrent ? 14 : 10,
                    height: isCurrent ? 14 : 10,
                    borderRadius: "50%",
                    bgcolor: dotColor,
                    border: isCurrent ? `2px solid ${stage.color}` : "2px solid transparent",
                    boxShadow: isCurrent ? `0 0 0 3px ${stage.color}33` : "none",
                    flexShrink: 0,
                    transition: "all 0.2s",
                    zIndex: 1,
                  }}
                />
              </Tooltip>

              {/* Connector line (not after last dot) */}
              {idx < STAGES.length - 1 && (
                <Box
                  sx={{
                    flex: 1,
                    height: 3,
                    bgcolor: lineColor,
                    borderRadius: 2,
                    mx: 0.3,
                  }}
                />
              )}
            </Box>
          );
        })}

        {/* Problem badge appended after last dot */}
        {isProblem && (
          <Tooltip title={item.status} placement="top" arrow>
            <Box
              sx={{
                ml: 1,
                px: 0.8,
                py: 0.2,
                borderRadius: 1,
                bgcolor: problemMeta.color,
                color: "#fff",
                fontSize: 9,
                fontWeight: 700,
                whiteSpace: "nowrap",
                lineHeight: 1.6,
              }}
            >
              ⚠ {problemMeta.label}
            </Box>
          </Tooltip>
        )}
      </Box>

      {/* Stage labels row (only show first, current, last) */}
      <Stack direction="row" justifyContent="space-between" sx={{ mt: 0.3, px: 0.2 }}>
        <Typography variant="caption" sx={{ fontSize: 9, color: "text.disabled" }}>
          {STAGES[0].label}
        </Typography>
        {!isProblem && currentIdx > 0 && currentIdx < STAGES.length - 1 && (
          <Typography variant="caption" sx={{ fontSize: 9, color: STAGES[currentIdx].color, fontWeight: 700 }}>
            ▲ {STAGES[currentIdx].label}
          </Typography>
        )}
        <Typography variant="caption" sx={{ fontSize: 9, color: "text.disabled" }}>
          {STAGES[STAGES.length - 1].label}
        </Typography>
      </Stack>
    </Box>
  );
}

// ── BOM Status Summary — donut chart + status cards ──────────────────────────
export function PipelineSummary({ bom }) {
  const total = bom.length;

  const segments = useMemo(() => {
    const counts = {};
    for (const item of bom) counts[item.status] = (counts[item.status] || 0) + 1;

    const allStages = [
      ...STAGES,
      ...Object.entries(PROBLEM_STATES).map(([key, val]) => ({ key, ...val })),
    ].filter(({ key }) => counts[key]);

    const R = 38;
    const circ = 2 * Math.PI * R;
    let cum = 0;
    return allStages.map(({ key, label, color }) => {
      const count = counts[key];
      const segLen = (count / total) * circ;
      const seg = { key, label, color, count, segLen, offset: cum, circ, R };
      cum += segLen;
      return seg;
    });
  }, [bom, total]);

  if (!total) return null;

  const installed   = bom.filter((b) => b.status === "Installed - Working").length;
  const problems    = bom.filter((b) => b.status in PROBLEM_STATES).length;
  const notStarted  = bom.filter((b) => b.status === "Work Yet to Start").length;
  const inProgress  = total - installed - problems - notStarted;

  const summaryStats = [
    { label: "Done",        value: installed,  color: "#22c55e" },
    { label: "In Progress", value: inProgress, color: "#3b82f6" },
    { label: "Issues",      value: problems,   color: "#ef4444" },
    { label: "Not Started", value: notStarted, color: "#9e9e9e" },
  ].filter((s) => s.value > 0);

  const R = 38;
  const CX = 55;
  const CY = 55;

  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>BOM Status Overview</Typography>
        <Typography variant="caption" color="text.secondary">{total} item{total !== 1 ? "s" : ""} total</Typography>
      </Stack>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={3} alignItems={{ sm: "center" }}>
        {/* SVG Donut */}
        <Box sx={{ position: "relative", flexShrink: 0, width: 110, height: 110 }}>
          <svg width="110" height="110" viewBox="0 0 110 110" style={{ transform: "rotate(-90deg)" }}>
            {/* Background ring */}
            <circle cx={CX} cy={CY} r={R} fill="none" stroke="#e5e7eb" strokeWidth="13" />
            {segments.map((s) => (
              <Tooltip key={s.key} title={`${s.key}: ${s.count}`} placement="top" arrow>
                <circle
                  cx={CX} cy={CY} r={R}
                  fill="none"
                  stroke={s.color}
                  strokeWidth="13"
                  strokeDasharray={`${s.segLen} ${s.circ - s.segLen}`}
                  strokeDashoffset={-s.offset}
                  style={{ transition: "stroke-dasharray 0.6s ease" }}
                />
              </Tooltip>
            ))}
          </svg>
          {/* Center label */}
          <Box sx={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <Typography sx={{ fontWeight: 800, fontSize: "1.3rem", lineHeight: 1 }}>{total}</Typography>
            <Typography variant="caption" sx={{ fontSize: 9, color: "text.secondary", letterSpacing: 0.5 }}>ITEMS</Typography>
          </Box>
        </Box>

        {/* Quick stats row */}
        <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap sx={{ flex: 1 }}>
          {summaryStats.map((s) => (
            <Box
              key={s.label}
              sx={{
                display: "flex", flexDirection: "column", alignItems: "center",
                px: 1.8, py: 1.2, borderRadius: 2.5,
                bgcolor: `${s.color}12`,
                border: `1.5px solid ${s.color}40`,
                minWidth: 68,
              }}
            >
              <Typography sx={{ fontWeight: 800, fontSize: "1.5rem", color: s.color, lineHeight: 1 }}>{s.value}</Typography>
              <Typography variant="caption" sx={{ fontSize: 10, color: "text.secondary", mt: 0.3 }}>{s.label}</Typography>
              <Typography variant="caption" sx={{ fontSize: 9, color: s.color, fontWeight: 600 }}>
                {Math.round((s.value / total) * 100)}%
              </Typography>
            </Box>
          ))}
        </Stack>
      </Stack>

      {/* Per-status chips row */}
      <Stack direction="row" flexWrap="wrap" useFlexGap spacing={0.8} sx={{ mt: 2 }}>
        {segments.map((s) => (
          <Tooltip key={s.key} title={s.key} arrow>
            <Stack
              direction="row" alignItems="center" spacing={0.6}
              sx={{
                px: 1.2, py: 0.5, borderRadius: 10,
                bgcolor: `${s.color}15`,
                border: `1px solid ${s.color}35`,
                cursor: "default",
              }}
            >
              <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: s.color, flexShrink: 0 }} />
              <Typography sx={{ fontSize: 11, fontWeight: 600, color: "text.primary" }}>{s.label}</Typography>
              <Typography sx={{ fontSize: 11, fontWeight: 800, color: s.color }}>{s.count}</Typography>
            </Stack>
          </Tooltip>
        ))}
      </Stack>
    </Box>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function BomStatusChart({ bom = [] }) {
  if (!bom.length) return null;

  const installed   = bom.filter((b) => b.status === "Installed - Working").length;
  const problems    = bom.filter((b) => b.status in PROBLEM_STATES).length;
  const inProgress  = bom.length - installed - problems -
                      bom.filter((b) => b.status === "Work Yet to Start").length;

  return (
    <Paper sx={{ mt: 2, p: 2, border: "1px solid", borderColor: "divider" }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          BOM Progress Tracker
        </Typography>
        <Stack direction="row" spacing={1.5}>
          {[
            { label: "Done",        value: installed,  color: "#22c55e" },
            { label: "In Progress", value: inProgress, color: "#3b82f6" },
            { label: "Issues",      value: problems,   color: "#ef4444" },
          ].map(({ label, value, color }) => (
            <Box key={label} sx={{ textAlign: "center" }}>
              <Typography variant="body2" sx={{ fontWeight: 700, color, lineHeight: 1.2 }}>{value}</Typography>
              <Typography variant="caption" sx={{ fontSize: 10, color: "text.secondary" }}>{label}</Typography>
            </Box>
          ))}
        </Stack>
      </Stack>

      <PipelineSummary bom={bom} />

      <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: "block" }}>
        Per-Item Status — hover dots for stage name
      </Typography>

      <Box sx={{ maxHeight: 420, overflowY: "auto", pr: 0.5 }}>
        {bom.map((item) => (
          <ItemProgressRow key={item.id} item={item} />
        ))}
      </Box>
    </Paper>
  );
}
