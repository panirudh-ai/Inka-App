import { useEffect, useMemo, useState } from "react";
import AppToast from '../components/AppToast'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  FormControl,
  Grid2 as Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Slide,
  Snackbar,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { api } from "../api/client";

const statuses = [
  "Work Yet to Start",
  "Position Marked",
  "Piping Done",
  "Wiring Done",
  "Wiring Checked OK",
  "Wiring Rework Required",
  "Provision Not Provided",
  "Position To Be Changed",
  "Installed - Working",
  "Installed - To Activate",
  "Installed - Not Working",
];

const OFFLINE_KEY = "inka_engineer_offline_queue";

function loadOfflineQueue() {
  const raw = localStorage.getItem(OFFLINE_KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveOfflineQueue(queue) {
  localStorage.setItem(OFFLINE_KEY, JSON.stringify(queue));
}

export default function EngineerView() {
  const [tab, setTab] = useState(0);
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState("");
  const [dashboard, setDashboard] = useState(null);
  const [activity, setActivity] = useState([]);
  const [deliveryQty, setDeliveryQty] = useState({});
  const [deliveryNotes, setDeliveryNotes] = useState({});
  const [deliveryPhotoFile, setDeliveryPhotoFile] = useState({});
  const [offlineQueue, setOfflineQueue] = useState(loadOfflineQueue());
  const [conflicts, setConflicts] = useState([]);
  const [visitNotes, setVisitNotes] = useState("");
  const [visits, setVisits] = useState([]);
  const [toast, setToast] = useState({ open: false, severity: "success", text: "" });

  const grouped = useMemo(() => {
    const map = new Map();
    for (const row of dashboard?.bom || []) {
      const floor = row.floor_label || "Unassigned";
      if (!map.has(floor)) map.set(floor, []);
      map.get(floor).push(row);
    }
    return Array.from(map.entries());
  }, [dashboard]);

  async function loadProjects() {
    const { data } = await api.get("/projects");
    setProjects(data);
    if (data.length && !projectId) setProjectId(data[0].id);
  }

  async function loadProjectData(pid) {
    if (!pid) return;
    const [dash, act] = await Promise.all([
      api.get(`/projects/${pid}/dashboard`),
      api.get(`/projects/${pid}/activity`),
    ]);
    setDashboard(dash.data);
    setActivity(act.data);
    const visitsRes = await api.get(`/projects/${pid}/visits`, { params: { paginated: true, page: 1, limit: 10 } }).catch(() => ({ data: { data: [] } }));
    setVisits(Array.isArray(visitsRes.data) ? visitsRes.data : visitsRes.data.data || []);
  }

  function queueOffline(action) {
    const next = [...offlineQueue, { ...action, queuedAt: new Date().toISOString() }];
    setOfflineQueue(next);
    saveOfflineQueue(next);
    setToast({ open: true, severity: "warning", text: "Offline queued. Sync when online." });
  }

  async function syncOffline() {
    let queue = [...offlineQueue];
    const remaining = [];
    const conflictRows = [];
    for (const action of queue) {
      try {
        if (action.type === "status") {
          await api.patch(`/projects/${action.projectId}/bom-items/${action.bomItemId}/status`, {
            status: action.status,
          });
        } else if (action.type === "delivery") {
          await api.post(`/projects/${action.projectId}/deliveries`, {
            itemId: action.itemId,
            quantity: action.quantity,
            notes: action.notes || "",
            photoUrl: action.photoUrl || undefined,
          });
        }
      } catch (error) {
        if (error?.response?.status === 409) {
          conflictRows.push({
            ...action,
            reason: error?.response?.data?.error || "Conflict",
          });
        } else {
          remaining.push(action);
        }
      }
    }
    setOfflineQueue(remaining);
    saveOfflineQueue(remaining);
    if (conflictRows.length) setConflicts((prev) => [...conflictRows, ...prev].slice(0, 20));
    setToast({ open: true, severity: "success", text: `Sync complete. Pending: ${remaining.length}` });
    await loadProjectData(projectId);
  }

  async function retryConflict(conflict, idx) {
    try {
      if (conflict.type === "status") {
        await api.patch(`/projects/${conflict.projectId}/bom-items/${conflict.bomItemId}/status`, {
          status: conflict.status,
        });
      } else if (conflict.type === "delivery") {
        await api.post(`/projects/${conflict.projectId}/deliveries`, {
          itemId: conflict.itemId,
          quantity: conflict.quantity,
          notes: conflict.notes || "",
          photoUrl: conflict.photoUrl || undefined,
        });
      }
      setConflicts((prev) => prev.filter((_, i) => i !== idx));
      setToast({ open: true, severity: "success", text: "Conflict retried successfully" });
      await loadProjectData(projectId);
    } catch (error) {
      setToast({
        open: true,
        severity: "error",
        text: error?.response?.data?.error || "Retry failed",
      });
    }
  }

  function discardConflict(idx) {
    setConflicts((prev) => prev.filter((_, i) => i !== idx));
  }

  useEffect(() => {
    loadProjects().catch(() => { });
  }, []);

  useEffect(() => {
    loadProjectData(projectId).catch(() => { });
  }, [projectId]);

  useEffect(() => {
    function handleOnline() {
      syncOffline().catch(() => { });
    }
    window.addEventListener("online", handleOnline);
    const timer = setInterval(() => {
      if (navigator.onLine && offlineQueue.length) {
        syncOffline().catch(() => { });
      }
    }, 10000);
    return () => {
      window.removeEventListener("online", handleOnline);
      clearInterval(timer);
    };
  }, [offlineQueue, projectId]);

  async function updateStatus(bomItemId, status) {
    try {
      await api.patch(`/projects/${projectId}/bom-items/${bomItemId}/status`, { status });
      setToast({ open: true, severity: "success", text: "Status updated" });
      await loadProjectData(projectId);
    } catch {
      queueOffline({ type: "status", projectId, bomItemId, status });
    }
  }

  async function logDelivery(itemId) {
    const qty = Number(deliveryQty[itemId] || 0);
    if (!qty || qty <= 0) return;
    try {
      let photoUrl;
      if (deliveryPhotoFile[itemId]) {
        const fd = new FormData();
        fd.append("photo", deliveryPhotoFile[itemId]);
        const uploaded = await api.post("/uploads/photo", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        photoUrl = uploaded.data.photoUrl;
      }
      await api.post(`/projects/${projectId}/deliveries`, {
        itemId,
        quantity: qty,
        notes: deliveryNotes[itemId] || "",
        photoUrl,
      });
      setToast({ open: true, severity: "success", text: "Delivery logged" });
      setDeliveryQty((prev) => ({ ...prev, [itemId]: "" }));
      setDeliveryNotes((prev) => ({ ...prev, [itemId]: "" }));
      setDeliveryPhotoFile((prev) => ({ ...prev, [itemId]: null }));
      await loadProjectData(projectId);
    } catch {
      queueOffline({
        type: "delivery",
        projectId,
        itemId,
        quantity: qty,
        notes: deliveryNotes[itemId] || "",
        photoUrl: undefined,
      });
    }
  }

  async function logVisit() {
    if (!projectId) return;
    await api.post(`/projects/${projectId}/visits`, { notes: visitNotes || "" });
    setVisitNotes("");
    setToast({ open: true, severity: "success", text: "Visit logged" });
    await loadProjectData(projectId);
  }

  return (
    <Box>
      <Paper sx={{ p: 1.5, mb: 1.5 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={1.2} justifyContent="space-between">
          <Typography variant="h6">Engineer Mobile App</Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ width: { xs: "100%", md: "auto" } }}>
            <FormControl size="small" sx={{ minWidth: { sm: 280 }, width: { xs: "100%", sm: "auto" } }}>
              <InputLabel>Project</InputLabel>
              <Select value={projectId} label="Project" onChange={(e) => setProjectId(e.target.value)}>
                {projects.map((p) => (
                  <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button variant="outlined" sx={{ width: { xs: "100%", sm: "auto" } }} onClick={syncOffline}>
              Sync ({offlineQueue.length})
            </Button>
            <Button variant="contained" sx={{ width: { xs: "100%", sm: "auto" } }} onClick={logVisit}>
              Log Visit
            </Button>
          </Stack>
        </Stack>
        <Stack direction={{ xs: "column", md: "row" }} spacing={1} sx={{ mt: 1 }}>
          <TextField size="small" label="Visit Notes" value={visitNotes} onChange={(e) => setVisitNotes(e.target.value)} fullWidth />
        </Stack>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.8, display: "block" }}>
          Total Visits: {Number(dashboard?.summary?.visit_count || 0)}
        </Typography>
      </Paper>

      <Paper sx={{ p: 1 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable">
          <Tab label="BOM" />
          <Tab label="Deliveries" />
          <Tab label="Activity" />
        </Tabs>
      </Paper>

      {tab === 0 && (
        <Box sx={{ mt: 1.5 }}>
          {grouped.map(([floor, rows]) => (
            <Box key={floor} sx={{ mb: 1.5 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.8 }}>Floor: {floor}</Typography>
              <Grid container spacing={1.5}>
                {rows.map((row, idx) => {
                  const balance = Number(row.quantity) - Number(row.delivered_quantity);
                  return (
                    <Grid size={{ xs: 12, sm: 6 }} key={row.id}>
                      <Slide direction="up" in timeout={250 + idx * 80}>
                        <Card sx={{ borderRadius: 2 }}>
                          <CardContent>
                            <Typography sx={{ fontWeight: 600 }}>{row.brand_name} {row.model_number}</Typography>
                            <Typography variant="caption" color="text.secondary">{row.product_type_name}</Typography>
                            <Typography variant="caption" display="block" color="text.secondary">Location: {row.location_description || "-"}</Typography>
                            <Stack direction="row" spacing={1} sx={{ mt: 1.1, mb: 1.1, flexWrap: "wrap" }} useFlexGap>
                              <Chip size="small" label={`Approved ${row.quantity}`} />
                              <Chip size="small" label={`Delivered ${row.delivered_quantity}`} color="success" />
                              <Chip size="small" label={`Balance ${balance}`} color="warning" />
                            </Stack>
                            <FormControl fullWidth size="small">
                              <InputLabel>Status</InputLabel>
                              <Select
                                label="Status"
                                value={row.status}
                                onChange={(e) => updateStatus(row.id, e.target.value)}
                              >
                                {statuses.map((s) => (
                                  <MenuItem key={s} value={s}>{s}</MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </CardContent>
                        </Card>
                      </Slide>
                    </Grid>
                  );
                })}
              </Grid>
            </Box>
          ))}
        </Box>
      )}

      {tab === 1 && (
        <Grid container spacing={1.5} sx={{ mt: 1.2 }}>
          {(dashboard?.bom || []).map((row) => (
            <Grid key={row.id} size={{ xs: 12, md: 6 }}>
              <Paper sx={{ p: 1.3 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{row.brand_name} {row.model_number}</Typography>
                <Stack direction={{ xs: "column", md: "row" }} spacing={1} sx={{ mt: 1 }}>
                  <TextField
                    size="small"
                    type="number"
                    label="Qty"
                    value={deliveryQty[row.item_id] || ""}
                    onChange={(e) => setDeliveryQty((prev) => ({ ...prev, [row.item_id]: e.target.value }))}
                  />
                  <TextField
                    size="small"
                    label="Note"
                    sx={{ flex: 1 }}
                    value={deliveryNotes[row.item_id] || ""}
                    onChange={(e) => setDeliveryNotes((prev) => ({ ...prev, [row.item_id]: e.target.value }))}
                  />
                  <Button variant="outlined" component="label" sx={{ width: { xs: "100%", md: "auto" } }}>
                    {deliveryPhotoFile[row.item_id] ? "Photo OK" : "Photo"}
                    <input
                      hidden
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        setDeliveryPhotoFile((prev) => ({
                          ...prev,
                          [row.item_id]: e.target.files?.[0] || null,
                        }))
                      }
                    />
                  </Button>
                  <Button variant="contained" sx={{ width: { xs: "100%", md: "auto" } }} onClick={() => logDelivery(row.item_id)}>
                    Log
                  </Button>
                </Stack>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}

      {tab === 2 && (
        <Stack spacing={1} sx={{ mt: 1.2 }}>
          {conflicts.length ? (
            <Paper sx={{ p: 1.2, border: "1px solid #f59e0b" }}>
              <Alert severity="warning" sx={{ mb: 1 }}>
                Conflicts detected: {conflicts.length}
              </Alert>
              <Stack spacing={1}>
                {conflicts.slice(0, 5).map((c, idx) => (
                  <Stack
                    key={`${c.type}-${c.queuedAt}-${idx}`}
                    direction={{ xs: "column", md: "row" }}
                    spacing={1}
                    alignItems={{ md: "center" }}
                    justifyContent="space-between"
                    sx={{ p: 1, bgcolor: "action.hover", borderRadius: 1.5 }}
                  >
                    <Typography variant="caption">
                      {c.type.toUpperCase()} | {c.reason || "Conflict"} | {new Date(c.queuedAt).toLocaleString()}
                    </Typography>
                    <Stack direction="row" spacing={1}>
                      <Button size="small" variant="outlined" onClick={() => retryConflict(c, idx)}>
                        Retry
                      </Button>
                      <Button size="small" color="error" onClick={() => discardConflict(idx)}>
                        Discard
                      </Button>
                    </Stack>
                  </Stack>
                ))}
              </Stack>
            </Paper>
          ) : null}
          {activity.slice(0, 30).map((a) => (
            <Paper key={a.id} sx={{ p: 1.1, bgcolor: "action.hover" }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>{a.action_type}</Typography>
              <Typography variant="caption" color="text.secondary">
                {new Date(a.created_at).toLocaleString()} {a.user_name ? `| ${a.user_name}` : ""}
              </Typography>
            </Paper>
          ))}
          {visits.slice(0, 5).map((v) => (
            <Typography key={v.id} variant="caption" color="text.secondary">
              Visit | {new Date(v.created_at).toLocaleString()} | {v.engineer_name || "Engineer"} | {v.notes || "-"}
            </Typography>
          ))}
        </Stack>
      )}

      <AppToast toast={toast} onClose={() => setToast((p) => ({ ...p, open: false }))} />
    </Box>
  );
}
