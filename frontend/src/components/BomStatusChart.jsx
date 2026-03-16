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

// ── Pipeline summary bar ──────────────────────────────────────────────────────
function PipelineSummary({ bom }) {
  const theme = useTheme();
  const total = bom.length;

  const stageCounts = useMemo(() => {
    const counts = {};
    for (const item of bom) counts[item.status] = (counts[item.status] || 0) + 1;
    return counts;
  }, [bom]);

  // All stages including problem states for the summary
  const allStages = [
    ...STAGES,
    ...Object.entries(PROBLEM_STATES).map(([key, val]) => ({ key, ...val })),
  ].filter(({ key }) => stageCounts[key]);

  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="caption" color="text.secondary" sx={{ mb: 0.8, display: "block" }}>
        Pipeline Overview — {total} item{total !== 1 ? "s" : ""}
      </Typography>
      {/* Stacked progress bar */}
      <Box sx={{ display: "flex", height: 20, borderRadius: 2, overflow: "hidden", width: "100%" }}>
        {allStages.map(({ key, color }) => {
          const count = stageCounts[key] || 0;
          if (!count) return null;
          const pct = (count / total) * 100;
          return (
            <Tooltip key={key} title={`${key}: ${count}`} placement="top" arrow>
              <Box sx={{ width: `${pct}%`, bgcolor: color, transition: "width 0.4s" }} />
            </Tooltip>
          );
        })}
      </Box>
      {/* Legend */}
      <Stack direction="row" flexWrap="wrap" useFlexGap spacing={1} sx={{ mt: 0.8 }}>
        {allStages.map(({ key, label, color }) => {
          const count = stageCounts[key] || 0;
          return (
            <Stack key={key} direction="row" alignItems="center" spacing={0.4}>
              <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: color, flexShrink: 0 }} />
              <Typography variant="caption" sx={{ fontSize: 10, color: "text.secondary" }}>
                {label || key} ({count})
              </Typography>
            </Stack>
          );
        })}
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
