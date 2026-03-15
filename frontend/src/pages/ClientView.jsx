import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  FormControl,
  Grid2 as Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import { api } from "../api/client";

export default function ClientView() {
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState("");
  const [dashboard, setDashboard] = useState(null);
  const [deliveries, setDeliveries] = useState([]);
  const [activity, setActivity] = useState([]);
  const [driveFiles, setDriveFiles] = useState([]);

  const grouped = useMemo(() => {
    const map = new Map();
    for (const row of dashboard?.bom || []) {
      const floor = row.floor_label || "Unassigned";
      if (!map.has(floor)) map.set(floor, []);
      map.get(floor).push(row);
    }
    return Array.from(map.entries());
  }, [dashboard]);

  useEffect(() => {
    api.get("/projects").then((res) => {
      setProjects(res.data);
      if (res.data.length) setProjectId(res.data[0].id);
    });
  }, []);

  useEffect(() => {
    if (!projectId) return;
    Promise.all([
      api.get(`/projects/${projectId}/dashboard`),
      api.get(`/projects/${projectId}/deliveries`),
      api.get(`/projects/${projectId}/activity`),
      api.get(`/projects/${projectId}/drive-files`).catch(() => ({ data: [] })),
    ]).then(([dash, del, act, drv]) => {
      setDashboard(dash.data);
      setDeliveries(del.data);
      setActivity(act.data);
      setDriveFiles(drv.data || []);
    });
  }, [projectId]);

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={1}>
          <Typography variant="h6">Client Portal (Read Only)</Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ width: { xs: "100%", md: "auto" } }}>
            <FormControl size="small" sx={{ minWidth: { sm: 260 }, width: { xs: "100%", sm: "auto" } }}>
              <InputLabel>Project</InputLabel>
              <Select value={projectId} label="Project" onChange={(e) => setProjectId(e.target.value)}>
                {projects.map((p) => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
              </Select>
            </FormControl>
            <Button
              variant="outlined"
              sx={{ width: { xs: "100%", sm: "auto" } }}
              onClick={async () => {
                if (!projectId) return;
                const res = await api.get(`/projects/${projectId}/report.xlsx`, { responseType: "blob" });
                const url = URL.createObjectURL(new Blob([res.data], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
                const a = document.createElement("a");
                a.href = url;
                a.download = `inka_report_${projectId}.xlsx`;
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              Download PDF Report
            </Button>
          </Stack>
        </Stack>
        {projects.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1.2 }}>
            No projects are mapped to this client account yet.
          </Typography>
        ) : null}
      </Paper>

      {dashboard?.project ? (
        <Paper sx={{ p: 2, mb: 1.2 }}>
          <Grid container spacing={1}>
            <Grid size={{ xs: 12, md: 3 }}><Typography variant="caption" color="text.secondary">Project</Typography><Typography variant="body2">{dashboard.project.name}</Typography></Grid>
            <Grid size={{ xs: 12, md: 3 }}><Typography variant="caption" color="text.secondary">Client</Typography><Typography variant="body2">{dashboard.project.client_name}</Typography></Grid>
            <Grid size={{ xs: 12, md: 3 }}><Typography variant="caption" color="text.secondary">Location</Typography><Typography variant="body2">{dashboard.project.location}</Typography></Grid>
            <Grid size={{ xs: 12, md: 3 }}><Typography variant="caption" color="text.secondary">Status</Typography><Typography variant="body2">{dashboard.project.status}</Typography></Grid>
          </Grid>
          {dashboard.project.drive_link ? (
            <Button
              sx={{ mt: 1 }}
              size="small"
              variant="outlined"
              onClick={() => window.open(dashboard.project.drive_link, "_blank", "noopener,noreferrer")}
            >
              Open Drive Link
            </Button>
          ) : null}
          {driveFiles.length ? (
            <Stack spacing={0.4} sx={{ mt: 1 }}>
              <Typography variant="caption" color="text.secondary">Drive Files</Typography>
              {driveFiles.slice(0, 8).map((f) => (
                <Button
                  key={f.id}
                  size="small"
                  variant="text"
                  sx={{ justifyContent: "flex-start" }}
                  onClick={() => window.open(f.webViewLink || f.webContentLink, "_blank", "noopener,noreferrer")}
                >
                  {f.name}
                </Button>
              ))}
            </Stack>
          ) : null}
        </Paper>
      ) : null}

      <Grid container spacing={1.2}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Approved BOM by System</Typography>
            {grouped.map(([floor, rows]) => (
              <Box key={floor} sx={{ mt: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>Floor: {floor}</Typography>
                <Stack spacing={0.8} sx={{ mt: 0.5 }}>
                  {rows.map((r) => (
                    <Paper key={r.id} sx={{ p: 1, bgcolor: "action.hover" }}>
                      <Typography variant="body2">{r.brand_name} {r.model_number}</Typography>
                      <Typography variant="caption" color="text.secondary">Location: {r.location_description || "-"}</Typography>
                      <Stack direction="row" spacing={1} sx={{ mt: 0.5 }} flexWrap="wrap" useFlexGap>
                        <Chip size="small" label={`Approved ${r.quantity}`} />
                        <Chip size="small" color="success" label={`Delivered ${r.delivered_quantity}`} />
                        <Chip size="small" color="warning" label={`Balance ${Number(r.quantity) - Number(r.delivered_quantity)}`} />
                        <Chip
                          size="small"
                          label={r.status}
                          color={
                            r.status === "Installed - Working" ? "success"
                            : r.status === "Installed - To Activate" ? "info"
                            : r.status === "Installed - Not Working" ? "error"
                            : r.status === "Wiring Done" || r.status === "Wiring Checked OK" ? "info"
                            : r.status === "Wiring Rework Required" || r.status === "Provision Not Provided" || r.status === "Position To Be Changed" ? "error"
                            : r.status === "Piping Done" || r.status === "Position Marked" ? "secondary"
                            : "default"
                          }
                          variant="outlined"
                        />
                      </Stack>
                    </Paper>
                  ))}
                </Stack>
              </Box>
            ))}
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 2, mb: 1.2 }}>
            <Typography variant="subtitle2">Delivery Progress</Typography>
            <Typography variant="body2">Scope: INR {Number(dashboard?.summary?.total_scope_value || 0).toLocaleString()}</Typography>
            <Typography variant="body2">Delivered: INR {Number(dashboard?.summary?.total_delivered_value || 0).toLocaleString()}</Typography>
            <Typography variant="body2">Balance: INR {Number(dashboard?.summary?.total_balance_value || 0).toLocaleString()}</Typography>
          </Paper>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2">Recent Activity</Typography>
            <Stack spacing={0.8} sx={{ mt: 1 }}>
              {activity.slice(0, 8).map((a) => (
                <Typography key={a.id} variant="caption">
                  {a.action_type} | {new Date(a.created_at).toLocaleString()}
                </Typography>
              ))}
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      <Paper sx={{ p: 2, mt: 1.5 }}>
        <Typography variant="subtitle2">Deliveries</Typography>
        <Stack spacing={0.8} sx={{ mt: 1 }}>
          {deliveries.slice(0, 10).map((d) => (
            <Typography key={d.id} variant="caption">
              {d.full_name} | Qty {d.quantity} | {d.engineer_name || "Engineer"} | {new Date(d.created_at).toLocaleString()}
            </Typography>
          ))}
        </Stack>
      </Paper>
    </Box>
  );
}
