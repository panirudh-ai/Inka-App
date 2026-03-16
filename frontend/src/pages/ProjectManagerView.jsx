import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { G8 } from "../theme";
import AppToast from '../components/AppToast'
import {
  Alert,
  Accordion,
  Autocomplete,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Chip,
  Collapse,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Fade,
  FormControl,
  Grid2 as Grid,
  InputLabel,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Select,
  Snackbar,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
  IconButton,
  Tooltip,
  Zoom,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import AddIcon from "@mui/icons-material/Add";
import CompareArrowsIcon from "@mui/icons-material/CompareArrows";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import HierarchySelector from "../components/HierarchySelector";
import { api } from "../api/client";
import KpiCard from "../components/KpiCard";
import BomStatusChart, { ItemProgressRow } from "../components/BomStatusChart";

export default function ProjectManagerView({ masterData, role = "project_manager" }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState([]);
  const [openProjectRowId, setOpenProjectRowId] = useState("");
  const [engineers, setEngineers] = useState([]);
  const [clients, setClients] = useState([]);
  const [clientMasters, setClientMasters] = useState([]);
  const [clientMasterForm, setClientMasterForm] = useState({
    name: "",
    location: "",
    primaryContactName: "",
    primaryContactPhone: "",
    primaryContactEmail: "",
    notes: "",
    isActive: true,
  });
  const [editClientMaster, setEditClientMaster] = useState({});
  const [reportSearch, setReportSearch] = useState("");
  const [reportOptions, setReportOptions] = useState([]);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportPage, setReportPage] = useState(1);
  const [selectedReportProject, setSelectedReportProject] = useState(null);
  const [projectId, setProjectId] = useState("");
  const [openCreateProject, setOpenCreateProject] = useState(false);
  const [newProject, setNewProject] = useState({
    name: "",
    clientId: "",
    clientName: "",
    location: "",
    driveLink: "",
    startDate: "",
    engineerIds: [],
    clientUserIds: [],
    categorySequenceMode: false,
  });
  const [dashboard, setDashboard] = useState(null);
  const [crs, setCrs] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [activity, setActivity] = useState([]);
  const [driveFiles, setDriveFiles] = useState([]);
  const [driveUploadFile, setDriveUploadFile] = useState(null);
  const [driveUploading, setDriveUploading] = useState(false);

  const [openAdd, setOpenAdd] = useState(false);
  const [selector, setSelector] = useState({ categoryId: "", productTypeId: "", brandId: "", itemId: "" });
  const [qty, setQty] = useState(1);
  const [rate, setRate] = useState(0);

  const [crSelector, setCrSelector] = useState({ categoryId: "", productTypeId: "", brandId: "", itemId: "" });
  const [crChangeType, setCrChangeType] = useState("add");
  const [crQty, setCrQty] = useState(1);
  const [crFloorLabel, setCrFloorLabel] = useState("Unassigned");
  const [crLocationDescription, setCrLocationDescription] = useState("");

  const [deliveryItemId, setDeliveryItemId] = useState("");
  const [deliveryQty, setDeliveryQty] = useState(1);
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [deliveryPhotoFile, setDeliveryPhotoFile] = useState(null);
  const [deliverySelector, setDeliverySelector] = useState({ categoryId: "", productTypeId: "", brandId: "", itemId: "" });
  const [crDiff, setCrDiff] = useState({ diff: [], summary: { totalDeltaQty: 0 } });
  const [floorLabel, setFloorLabel] = useState("Unassigned");
  const [locationDescription, setLocationDescription] = useState("");
  const [projectContacts, setProjectContacts] = useState([]);
  const [visitNotes, setVisitNotes] = useState("");
  const [visits, setVisits] = useState([]);
  const [visitSummary, setVisitSummary] = useState({ totals: {}, byEngineer: [], byMonth: [] });

  const [toast, setToast] = useState({ open: false, severity: "success", text: "" });
  const [excelImportFile, setExcelImportFile] = useState(null);
  const [excelImporting, setExcelImporting] = useState(false);
  const [excelImportResult, setExcelImportResult] = useState(null);
  const PAGE_SIZE = 10;
  const [projectPage, setProjectPage] = useState(1);
  const [projectPagination, setProjectPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [clientPage, setClientPage] = useState(1);
  const [clientPagination, setClientPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const canEditScope = role === "admin" || role === "project_manager";
  const [outerTab, setOuterTab] = useState(0);
  const [editProjectOpen, setEditProjectOpen] = useState(false);
  const [editProjectId, setEditProjectId] = useState("");
  const [editProjectForm, setEditProjectForm] = useState({ name: "", clientId: "", clientName: "", location: "", driveLink: "", startDate: "", engineerIds: [], clientUserIds: [], categorySequenceMode: false });
  const [deleteProjectOpen, setDeleteProjectOpen] = useState(false);
  const [deleteProjectId, setDeleteProjectId] = useState("");
  const [viewMode, setViewMode] = useState("list");
  const [statusFilter, setStatusFilter] = useState("");

  const openCr = useMemo(() => crs.find((c) => c.status === "draft" || c.status === "pending"), [crs]);
  const openCrCount = useMemo(() => projects.filter((p) => p.has_open_cr).length, [projects]);

  const grouped = useMemo(() => {
    const map = new Map();
    for (const row of dashboard?.bom || []) {
      const category = row.category_name || "Uncategorised";
      if (!map.has(category)) map.set(category, []);
      map.get(category).push(row);
    }
    return Array.from(map.entries());
  }, [dashboard]);

  const selectedModel = useMemo(
    () => masterData.items.find((i) => i.id === selector.itemId),
    [masterData.items, selector.itemId]
  );
  const selectedDeliveryItemId = deliverySelector.itemId || deliveryItemId;
  const selectedDeliveryBom = useMemo(
    () => (dashboard?.bom || []).find((b) => b.item_id === selectedDeliveryItemId),
    [dashboard?.bom, selectedDeliveryItemId]
  );

  const reportSearchTimerRef = useRef(null);
  function fetchReportOptions(query) {
    clearTimeout(reportSearchTimerRef.current);
    reportSearchTimerRef.current = setTimeout(async () => {
      setReportLoading(true);
      try {
        const params = { limit: 20 };
        if (query) params.search = query;
        const res = await api.get("/projects", { params });
        setReportOptions(Array.isArray(res.data) ? res.data : res.data.data || []);
      } finally {
        setReportLoading(false);
      }
    }, 300);
  }

  async function fetchProjects() {
    const params = { paginated: true, page: projectPage, limit: PAGE_SIZE };
    if (statusFilter) params.status = statusFilter;
    const { data } = await api.get("/projects", { params });
    const rows = (Array.isArray(data) ? data : data.data || []).reverse();
    setProjects(rows);
    setProjectPagination(Array.isArray(data) ? { page: 1, totalPages: 1, total: data.length } : data.pagination || { page: 1, totalPages: 1, total: 0 });
    if (rows.length && !projectId) setProjectId(rows[0].id);
  }

  async function fetchEngineers() {
    const [engRes, clientRes] = await Promise.all([
      api.get("/reference/users?role=engineer"),
      api.get("/reference/users?role=client"),
    ]);
    setEngineers(engRes.data);
    setClients(clientRes.data);
  }

  async function fetchClientMasters() {
    const { data } = await api.get("/clients", { params: { paginated: true, page: clientPage, limit: PAGE_SIZE } });
    setClientMasters((Array.isArray(data) ? data : data.data || []).reverse());
    setClientPagination(Array.isArray(data) ? { page: 1, totalPages: 1, total: data.length } : data.pagination || { page: 1, totalPages: 1, total: 0 });
  }

  async function loadProject(pid) {
    if (!pid) return;
    setLoading(true);
    try {
      const [dashboardRes, crRes, deliveryRes, activityRes] = await Promise.all([
        api.get(`/projects/${pid}/dashboard`),
        api.get(`/projects/${pid}/change-requests`),
        api.get(`/projects/${pid}/deliveries`),
        api.get(`/projects/${pid}/activity`),
      ]);
      setDashboard(dashboardRes.data);
      setCrs(crRes.data);
      setDeliveries(deliveryRes.data);
      setActivity(activityRes.data);
      const visitsRes = await api.get(`/projects/${pid}/visits`, { params: { paginated: true, page: 1, limit: 10 } }).catch(() => ({ data: { data: [] } }));
      setVisits(Array.isArray(visitsRes.data) ? visitsRes.data : visitsRes.data.data || []);
      const visitSummaryRes = await api.get(`/projects/${pid}/visits/summary`).catch(() => ({ data: { totals: {}, byEngineer: [], byMonth: [] } }));
      setVisitSummary(visitSummaryRes.data || { totals: {}, byEngineer: [], byMonth: [] });
      const driveRes = await api.get(`/projects/${pid}/drive-files`).catch(() => ({ data: [] }));
      setDriveFiles(driveRes.data || []);
      setProjectContacts(dashboardRes.data?.contacts || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchEngineers().catch(() => { });
  }, []);

  useEffect(() => {
    fetchProjects().catch(() => { });
  }, [projectPage, statusFilter]);


  useEffect(() => {
    fetchClientMasters().catch(() => { });
  }, [clientPage]);

  useEffect(() => {
    loadProject(projectId).catch(() => { });
  }, [projectId]);

  useEffect(() => {
    if (selectedModel) setRate(Number(selectedModel.default_rate || 0));
  }, [selectedModel]);

  const reportPageSize = 10;
  const reportTotalPages = Math.max(1, Math.ceil(reportOptions.length / reportPageSize));
  const pagedReportRows = reportOptions.slice((reportPage - 1) * reportPageSize, reportPage * reportPageSize);

  useEffect(() => {
    const match = window.location.pathname.match(/\/project\/([^/]+)\/dashboard/);
    if (match) {
      setProjectId(match[1]);
      setOuterTab(0);
      setViewMode("dashboard");
    }
  }, []);

  useEffect(() => {
    function onPop() { setViewMode("list"); }
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  function openProjectDashboard(pid) {
    setProjectId(pid);
    setOuterTab(0);
    setViewMode("dashboard");
    window.history.pushState({ projectId: pid }, "", `/project/${pid}/dashboard`);
  }

  function goBackToList() {
    setViewMode("list");
    window.history.back();
  }

  async function addBomItem() {
    if (!openCr?.id || !selector.itemId) return;
    await api.post(`/change-requests/${openCr.id}/items`, {
      itemId: selector.itemId,
      changeType: "add",
      oldQuantity: null,
      newQuantity: Number(qty),
      floorLabel: floorLabel || "Unassigned",
      locationDescription: locationDescription || "",
    });
    setOpenAdd(false);
    setSelector({ categoryId: "", productTypeId: "", brandId: "", itemId: "" });
    setQty(1);
    setRate(0);
    setFloorLabel("Unassigned");
    setLocationDescription("");
    setToast({ open: true, severity: "success", text: "Added to CR diff" });
    await loadProject(projectId);
  }

  async function createCr() {
    if (!projectId) return;
    await api.post(`/projects/${projectId}/change-requests`);
    setToast({ open: true, severity: "success", text: "Change request created" });
    await loadProject(projectId);
  }

  async function addCrItem() {
    if (!openCr?.id || !crSelector.itemId) return;
    const current = dashboard?.bom?.find((x) => x.item_id === crSelector.itemId);
    const payload = {
      itemId: crSelector.itemId,
      changeType: crChangeType,
      oldQuantity: current ? Number(current.quantity) : null,
      newQuantity: crChangeType === "delete" ? null : Number(crQty),
      floorLabel: crFloorLabel || "Unassigned",
      locationDescription: crLocationDescription || "",
    };
    await api.post(`/change-requests/${openCr.id}/items`, payload);
    setToast({ open: true, severity: "success", text: "CR delta added" });
    await loadProject(projectId);
  }

  useEffect(() => {
    if (!openCr?.id) {
      setCrDiff({ diff: [], summary: { totalDeltaQty: 0 } });
      return;
    }
    api
      .get(`/change-requests/${openCr.id}/diff`)
      .then((res) => setCrDiff(res.data))
      .catch(() => setCrDiff({ diff: [], summary: { totalDeltaQty: 0 } }));
  }, [openCr?.id, dashboard?.bom?.length]);

  async function submitCr() {
    if (!openCr?.id) return;
    await api.post(`/change-requests/${openCr.id}/submit`);
    setToast({ open: true, severity: "success", text: "CR submitted" });
    await loadProject(projectId);
  }

  async function approveCr() {
    if (!openCr?.id) return;
    await api.post(`/change-requests/${openCr.id}/approve`);
    setToast({ open: true, severity: "success", text: "CR approved" });
    await loadProject(projectId);
  }

  async function rejectCr() {
    if (!openCr?.id) return;
    await api.post(`/change-requests/${openCr.id}/reject`);
    setToast({ open: true, severity: "success", text: "CR rejected" });
    await loadProject(projectId);
  }

  async function logDelivery() {
    const itemId = deliverySelector.itemId || deliveryItemId;
    if (!projectId || !itemId) return;
    let photoUrl;
    if (deliveryPhotoFile) {
      const fd = new FormData();
      fd.append("photo", deliveryPhotoFile);
      const uploaded = await api.post("/uploads/photo", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      photoUrl = uploaded.data.photoUrl;
    }
    await api.post(`/projects/${projectId}/deliveries`, {
      itemId,
      quantity: Number(deliveryQty),
      notes: deliveryNotes,
      photoUrl,
    });
    setToast({ open: true, severity: "success", text: "Delivery logged" });
    setDeliveryItemId("");
    setDeliverySelector({ categoryId: "", productTypeId: "", brandId: "", itemId: "" });
    setDeliveryQty(1);
    setDeliveryNotes("");
    setDeliveryPhotoFile(null);
    await loadProject(projectId);
  }

  async function createProject() {
    await api.post("/projects", {
      ...newProject,
      clientId: newProject.clientId || undefined,
      engineerIds: newProject.engineerIds,
      clientUserIds: newProject.clientUserIds,
      categorySequenceMode: !!newProject.categorySequenceMode,
    });
    setOpenCreateProject(false);
    setNewProject({
      name: "",
      clientId: "",
      clientName: "",
      location: "",
      driveLink: "",
      startDate: "",
      engineerIds: [],
      clientUserIds: [],
      categorySequenceMode: false,
    });
    setToast({ open: true, severity: "success", text: "Project created" });
    await fetchProjects();
  }

  async function saveEditProject() {
    if (!editProjectId) return;
    await api.patch(`/projects/${editProjectId}`, {
      name: editProjectForm.name || undefined,
      clientId: editProjectForm.clientId || undefined,
      clientName: editProjectForm.clientName || undefined,
      location: editProjectForm.location || undefined,
      driveLink: editProjectForm.driveLink || null,
      startDate: editProjectForm.startDate || null,
      engineerIds: editProjectForm.engineerIds,
      clientUserIds: editProjectForm.clientUserIds,
      categorySequenceMode: !!editProjectForm.categorySequenceMode,
    });
    setEditProjectOpen(false);
    setToast({ open: true, severity: "success", text: "Project updated" });
    await fetchProjects();
  }

  async function confirmDeleteProject() {
    if (!deleteProjectId) return;
    await api.delete(`/projects/${deleteProjectId}`);
    setDeleteProjectOpen(false);
    setDeleteProjectId("");
    setToast({ open: true, severity: "success", text: "Project deleted" });
    if (projectId === deleteProjectId) setProjectId("");
    await fetchProjects();
  }


  async function uploadDriveFile() {
    if (!projectId || !driveUploadFile) return;
    setDriveUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", driveUploadFile);
      fd.append("projectId", projectId);
      await api.post("/uploads/drive", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setDriveUploadFile(null);
      setToast({ open: true, severity: "success", text: "File uploaded to Google Drive" });
      await loadProject(projectId);
    } catch (e) {
      setToast({
        open: true,
        severity: "error",
        text: e?.response?.data?.error || "Drive upload failed",
      });
    } finally {
      setDriveUploading(false);
    }
  }

  async function saveContacts() {
    if (!projectId) return;
    await api.put(`/projects/${projectId}/contacts`, {
      contacts: projectContacts.map((c) => ({
        roleName: c.roleName || c.role_name || "",
        contactName: c.contactName || c.contact_name || "",
        phone: c.phone || "",
        email: c.email || "",
        notes: c.notes || "",
      })),
    });
    setToast({ open: true, severity: "success", text: "Contacts updated" });
    await loadProject(projectId);
  }

  async function logVisit() {
    if (!projectId) return;
    await api.post(`/projects/${projectId}/visits`, { notes: visitNotes || "" });
    setVisitNotes("");
    setToast({ open: true, severity: "success", text: "Site visit logged" });
    await loadProject(projectId);
  }

  async function createClientMaster() {
    await api.post("/clients", clientMasterForm);
    setClientMasterForm({
      name: "",
      location: "",
      primaryContactName: "",
      primaryContactPhone: "",
      primaryContactEmail: "",
      notes: "",
      isActive: true,
    });
    setToast({ open: true, severity: "success", text: "Client created" });
    await fetchClientMasters();
  }

  async function saveClientMaster(clientId) {
    await api.patch(`/clients/${clientId}`, editClientMaster[clientId] || {});
    setEditClientMaster((prev) => ({ ...prev, [clientId]: undefined }));
    setToast({ open: true, severity: "success", text: "Client updated" });
    await fetchClientMasters();
  }

  async function deleteClientMaster(clientId) {
    await api.delete(`/clients/${clientId}`);
    setToast({ open: true, severity: "success", text: "Client deleted" });
    await fetchClientMasters();
  }

  async function importExcel() {
    if (!excelImportFile) return;
    setExcelImporting(true);
    setExcelImportResult(null);
    try {
      const fd = new FormData();
      fd.append("file", excelImportFile);
      const res = await api.post("/uploads/excel-import", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setExcelImportResult(res.data);
      setToast({ open: true, severity: "success", text: `Excel imported: ${res.data.projectsImported} projects, ${res.data.itemsCreated} items created` });
      setExcelImportFile(null);
      await fetchProjects();
      await fetchClientMasters();
    } catch (e) {
      setToast({ open: true, severity: "error", text: e?.response?.data?.error || "Excel import failed" });
    } finally {
      setExcelImporting(false);
    }
  }

  return (
    <Fade in timeout={420}>
    <Box>
      {viewMode !== "dashboard" && (
      <Grid container spacing={2.2} sx={{ mb: 2 }}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <KpiCard title="Total Projects" value={projectPagination.total || projects.length} subtitle="Portfolio visibility" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <KpiCard title="Open CRs" value={openCrCount} subtitle="Pending approvals" color={G8.orange} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <KpiCard title="Categories" value={masterData.categories.length} subtitle="Structured scope hierarchy" color={G8.orange} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <KpiCard title="Item Master" value={masterData.items.length} subtitle="Model-level control" color={G8.orange} />
        </Grid>
      </Grid>
      )}

      {viewMode === "list" && (
      <Paper sx={{ mb: 2, p: 1 }}>
        <Tabs
          value={outerTab}
          onChange={(_, v) => setOuterTab(v)}
          variant="scrollable"
          allowScrollButtonsMobile
          scrollButtons="auto"
        >
          <Tab label="Projects" />
          <Tab label="Clients" />
          <Tab label="Reports" />
        </Tabs>
      </Paper>
      )}

      {viewMode === "list" && outerTab === 0 && (
      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={1} justifyContent="space-between" alignItems={{ md: "center" }}>
          <Typography variant="h6">Project List</Typography>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
            <FormControl size="small" sx={{ minWidth: 130 }}>
              <InputLabel>Status</InputLabel>
              <Select
                label="Status"
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setProjectPage(1); }}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="on_hold">On Hold</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
              </Select>
            </FormControl>
            <Button variant="contained" onClick={() => setOpenCreateProject(true)}>Create Project</Button>
          </Stack>
        </Stack>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
          <Button size="small" disabled={projectPagination.page <= 1} onClick={() => setProjectPage((p) => Math.max(1, p - 1))}>Prev</Button>
          <Typography variant="caption" color="text.secondary">
            Page {projectPagination.page} / {projectPagination.totalPages}
          </Typography>
          <Button size="small" disabled={projectPagination.page >= projectPagination.totalPages} onClick={() => setProjectPage((p) => p + 1)}>Next</Button>
          <Typography variant="caption" color="text.secondary">({projectPagination.total} total)</Typography>
        </Stack>
        {isMobile ? (
          <Stack spacing={1.1} sx={{ mt: 1.2 }}>
            {projects.map((p) => (
              <Paper
                key={p.id}
                onClick={() => setProjectId(p.id)}
                sx={{
                  p: 1.2,
                  cursor: "pointer",
                  bgcolor: projectId === p.id ? "action.selected" : "background.paper",
                  border: `1px solid ${theme.palette.divider}`,
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 700 }}>{p.name}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {p.client_name} | {p.status} | Open CR: {p.has_open_cr ? "Yes" : "No"}
                </Typography>
                <Typography variant="caption" display="block" color="text.secondary">
                  {p.last_activity ? new Date(p.last_activity).toLocaleString() : "-"}
                </Typography>
                <Stack direction="row" spacing={0.5} sx={{ mt: 0.5 }}>
                  <Tooltip title="Edit project">
                    <IconButton
                      size="small"
                      color="primary"
                      sx={{ borderRadius: 1.5 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditProjectId(p.id);
                        setEditProjectForm({
                          name: p.name || "",
                          clientId: p.client_id || "",
                          clientName: p.client_name || "",
                          location: p.location || "",
                          driveLink: p.drive_link || "",
                          startDate: p.start_date ? p.start_date.slice(0, 10) : "",
                          engineerIds: p.engineer_ids || [],
                          clientUserIds: p.client_user_ids || [],
                          categorySequenceMode: !!p.category_sequence_mode,
                        });
                        setEditProjectOpen(true);
                      }}
                    ><EditOutlinedIcon fontSize="small" /></IconButton>
                  </Tooltip>
                  <Tooltip title="Delete project">
                    <IconButton
                      size="small"
                      color="error"
                      sx={{ borderRadius: 1.5 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteProjectId(p.id);
                        setDeleteProjectOpen(true);
                      }}
                    ><DeleteOutlineIcon fontSize="small" /></IconButton>
                  </Tooltip>
                </Stack>
              </Paper>
            ))}
          </Stack>
        ) : (
          <TableContainer sx={{ mt: 1, overflowX: "auto" }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Project</TableCell>
                  <TableCell>Client</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Open CR</TableCell>
                  <TableCell>Visits</TableCell>
                  <TableCell>Last Activity</TableCell>
                  <TableCell>View</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {projects.map((p) => (
                  <Fragment key={p.id}>
                    <TableRow
                      hover
                      onClick={() => {
                        setProjectId(p.id);
                        setOpenProjectRowId((prev) => (prev === p.id ? "" : p.id));
                      }}
                      sx={{ cursor: "pointer", bgcolor: projectId === p.id ? "action.selected" : "transparent" }}
                    >
                      <TableCell>{p.name}</TableCell>
                      <TableCell>{p.client_name}</TableCell>
                      <TableCell>{p.status}</TableCell>
                      <TableCell>{p.has_open_cr ? "Yes" : "No"}</TableCell>
                      <TableCell>{Number(p.visit_count || 0)}</TableCell>
                      <TableCell>{p.last_activity ? new Date(p.last_activity).toLocaleString() : "-"}</TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={0.5}>
                          <Button
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              setProjectId(p.id);
                              setOpenProjectRowId((prev) => (prev === p.id ? "" : p.id));
                            }}
                          >
                            {openProjectRowId === p.id ? "Close" : "Open"}
                          </Button>
                          <Tooltip title="Edit project">
                            <IconButton size="small" color="primary" sx={{ borderRadius: 1.5 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditProjectId(p.id);
                                setEditProjectForm({
                                  name: p.name || "",
                                  clientId: p.client_id || "",
                                  clientName: p.client_name || "",
                                  location: p.location || "",
                                  driveLink: p.drive_link || "",
                                  startDate: p.start_date ? p.start_date.slice(0, 10) : "",
                                  engineerIds: p.engineer_ids || [],
                                  clientUserIds: p.client_user_ids || [],
                                  categorySequenceMode: !!p.category_sequence_mode,
                                });
                                setEditProjectOpen(true);
                              }}
                            ><EditOutlinedIcon fontSize="small" /></IconButton>
                          </Tooltip>
                          <Tooltip title="Delete project">
                            <IconButton size="small" color="error" sx={{ borderRadius: 1.5 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteProjectId(p.id);
                                setDeleteProjectOpen(true);
                              }}
                            ><DeleteOutlineIcon fontSize="small" /></IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell colSpan={7} sx={{ p: 0, borderBottom: openProjectRowId === p.id ? undefined : 0 }}>
                        <Collapse in={openProjectRowId === p.id} timeout="auto" unmountOnExit>
                          <Box sx={{ p: 1.3, bgcolor: "background.default" }}>
                            <Grid container spacing={1}>
                              <Grid size={{ xs: 12, md: 3 }}><Typography variant="caption" color="text.secondary">Project</Typography><Typography variant="body2">{p.name}</Typography></Grid>
                              <Grid size={{ xs: 12, md: 3 }}><Typography variant="caption" color="text.secondary">Client</Typography><Typography variant="body2">{p.client_name}</Typography></Grid>
                              <Grid size={{ xs: 12, md: 3 }}><Typography variant="caption" color="text.secondary">Location</Typography><Typography variant="body2">{dashboard?.project?.id === p.id ? dashboard.project.location : p.location}</Typography></Grid>
                              <Grid size={{ xs: 12, md: 3 }}><Typography variant="caption" color="text.secondary">Status</Typography><Typography variant="body2">{p.status}</Typography></Grid>
                            </Grid>
                            <Stack direction="row" spacing={1} sx={{ mt: 1 }} flexWrap="wrap" useFlexGap>
                              <Chip size="small" label={`Visits: ${Number(p.visit_count || 0)}`} color="info" />
                              <Chip size="small" label={`Open CR: ${p.has_open_cr ? "Yes" : "No"}`} color={p.has_open_cr ? "warning" : "success"} />
                              {dashboard?.project?.id === p.id ? (
                                <>
                                  <Chip size="small" label={`Scope: INR ${Number(dashboard.summary?.total_scope_value || 0).toLocaleString()}`} color="primary" />
                                  <Chip size="small" label={`Delivered: INR ${Number(dashboard.summary?.total_delivered_value || 0).toLocaleString()}`} color="success" />
                                  <Chip size="small" label={`Balance: INR ${Number(dashboard.summary?.total_balance_value || 0).toLocaleString()}`} color="warning" />
                                </>
                              ) : null}
                            </Stack>
                            <Button
                              sx={{ mt: 1 }}
                              size="small"
                              variant="outlined"
                              onClick={() => openProjectDashboard(p.id)}
                            >
                              Open In Dashboard
                            </Button>
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </Fragment>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
      )}

      {viewMode === "list" && outerTab === 1 && (
      <>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6">Client Master</Typography>
        <Stack direction={{ xs: "column", md: "row" }} spacing={1} sx={{ mt: 1 }}>
          <TextField size="small" label="Name" value={clientMasterForm.name} onChange={(e) => setClientMasterForm((p) => ({ ...p, name: e.target.value }))} />
          <TextField size="small" label="Location" value={clientMasterForm.location} onChange={(e) => setClientMasterForm((p) => ({ ...p, location: e.target.value }))} />
          <TextField size="small" label="Primary Contact" value={clientMasterForm.primaryContactName} onChange={(e) => setClientMasterForm((p) => ({ ...p, primaryContactName: e.target.value }))} />
          <TextField size="small" label="Phone" value={clientMasterForm.primaryContactPhone} onChange={(e) => setClientMasterForm((p) => ({ ...p, primaryContactPhone: e.target.value }))} />
          <TextField size="small" label="Email" value={clientMasterForm.primaryContactEmail} onChange={(e) => setClientMasterForm((p) => ({ ...p, primaryContactEmail: e.target.value }))} />
          <Button variant="contained" onClick={() => createClientMaster().catch(() => setToast({ open: true, severity: "error", text: "Create client failed" }))}>Add</Button>
        </Stack>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
          <Button size="small" disabled={clientPagination.page <= 1} onClick={() => setClientPage((p) => Math.max(1, p - 1))}>Prev</Button>
          <Typography variant="caption" color="text.secondary">
            Page {clientPagination.page} / {clientPagination.totalPages}
          </Typography>
          <Button size="small" disabled={clientPagination.page >= clientPagination.totalPages} onClick={() => setClientPage((p) => p + 1)}>Next</Button>
          <Typography variant="caption" color="text.secondary">({clientPagination.total} total)</Typography>
        </Stack>
        <TableContainer sx={{ mt: 1, overflowX: "auto" }}>
          <Table size="small" sx={{ minWidth: 900 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ minWidth: 120 }}>Name</TableCell>
                <TableCell sx={{ minWidth: 110 }}>Location</TableCell>
                <TableCell sx={{ minWidth: 110 }}>Contact</TableCell>
                <TableCell sx={{ width: 120, minWidth: 120 }}>Phone</TableCell>
                <TableCell sx={{ minWidth: 140 }}>Email</TableCell>
                <TableCell sx={{ minWidth: 100 }}>Projects</TableCell>
                <TableCell sx={{ width: 60, whiteSpace: "nowrap" }}>Active</TableCell>
                <TableCell sx={{ width: 80, whiteSpace: "nowrap" }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {clientMasters.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <TextField size="small" value={editClientMaster[c.id]?.name ?? c.name} onChange={(e) => setEditClientMaster((p) => ({ ...p, [c.id]: { ...(p[c.id] || {}), name: e.target.value } }))} />
                  </TableCell>
                  <TableCell>
                    <TextField size="small" value={editClientMaster[c.id]?.location ?? c.location ?? ""} onChange={(e) => setEditClientMaster((p) => ({ ...p, [c.id]: { ...(p[c.id] || {}), location: e.target.value } }))} />
                  </TableCell>
                  <TableCell>
                    <TextField size="small" value={editClientMaster[c.id]?.primaryContactName ?? c.primary_contact_name ?? ""} onChange={(e) => setEditClientMaster((p) => ({ ...p, [c.id]: { ...(p[c.id] || {}), primaryContactName: e.target.value } }))} />
                  </TableCell>
                  <TableCell sx={{ width: 130 }}>
                    <TextField size="small" value={editClientMaster[c.id]?.primaryContactPhone ?? c.primary_contact_phone ?? ""} onChange={(e) => setEditClientMaster((p) => ({ ...p, [c.id]: { ...(p[c.id] || {}), primaryContactPhone: e.target.value } }))} inputProps={{ style: { width: 110 } }} />
                  </TableCell>
                  <TableCell>
                    <TextField size="small" value={editClientMaster[c.id]?.primaryContactEmail ?? c.primary_contact_email ?? ""} onChange={(e) => setEditClientMaster((p) => ({ ...p, [c.id]: { ...(p[c.id] || {}), primaryContactEmail: e.target.value } }))} />
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption">{Number(c.project_count || 0)}</Typography>
                    <Typography variant="caption" display="block" color="text.secondary">
                      {(c.associated_projects || []).slice(0, 2).join(", ")}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Select
                      size="small"
                      value={(editClientMaster[c.id]?.isActive ?? c.is_active) ? "active" : "inactive"}
                      onChange={(e) => setEditClientMaster((p) => ({ ...p, [c.id]: { ...(p[c.id] || {}), isActive: e.target.value === "active" } }))}
                    >
                      <MenuItem value="active">Active</MenuItem>
                      <MenuItem value="inactive">Inactive</MenuItem>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.5}>
                      <Tooltip title="Save client">
                        <IconButton size="small" sx={{ borderRadius: 1.5 }} color="success" onClick={() => saveClientMaster(c.id).catch(() => setToast({ open: true, severity: "error", text: "Save client failed" }))}><CheckCircleOutlineIcon fontSize="small" /></IconButton>
                      </Tooltip>
                      <Tooltip title="Delete client">
                        <IconButton size="small" color="error" onClick={() => deleteClientMaster(c.id).catch(() => setToast({ open: true, severity: "error", text: "Delete client failed" }))} sx={{ borderRadius: 1.5 }}><DeleteOutlineIcon fontSize="small" /></IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6">Excel Import</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 1 }}>
          Import projects, clients, and master data from Excel. File should have &quot;ClientProjects List&quot; sheet with project names, and project sheets with Brand/Product/Model columns.
        </Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          <Button variant="outlined" component="label" size="small">
            {excelImportFile ? `Selected: ${excelImportFile.name}` : "Select Excel File"}
            <input
              hidden
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => setExcelImportFile(e.target.files?.[0] || null)}
            />
          </Button>
          <Button
            variant="contained"
            size="small"
            disabled={!excelImportFile || excelImporting}
            onClick={() => importExcel().catch(() => setToast({ open: true, severity: "error", text: "Import failed" }))}
          >
            {excelImporting ? "Importing..." : "Import Excel"}
          </Button>
        </Stack>
        {excelImportResult && (
          <Paper sx={{ p: 1.5, mt: 1, bgcolor: "action.hover" }}>
            <Typography variant="subtitle2">Import Results:</Typography>
            <Typography variant="caption" display="block">
              Projects: {excelImportResult.projectsImported} | Clients: {excelImportResult.clientsCreated} |
              Brands: {excelImportResult.brandsCreated} | Product Types: {excelImportResult.productTypesCreated} |
              Items: {excelImportResult.itemsCreated} | BOM Items: {excelImportResult.bomItemsCreated}
            </Typography>
            {excelImportResult.errors?.length > 0 && (
              <Typography variant="caption" color="error" display="block" sx={{ mt: 0.5 }}>
                Errors: {excelImportResult.errors.length}
              </Typography>
            )}
          </Paper>
        )}
      </Paper>
      </>
      )}

      {viewMode === "dashboard" && (
      <>
      <Button variant="outlined" sx={{ mb: 2 }} onClick={goBackToList}>
        ← Back to Projects
      </Button>
      <Paper id="pm-project-dashboard" sx={{ p: 0, mb: 2, borderRadius: 3, overflow: "hidden", border: "1px solid", borderColor: "divider" }}>
        <Box sx={{ px: 2.5, pt: 2.5, pb: 2, background: (t) => t.palette.mode === "dark" ? "linear-gradient(135deg, rgba(220,86,72,0.08) 0%, rgba(220,86,72,0.03) 100%)" : "linear-gradient(135deg, rgba(220,86,72,0.06) 0%, rgba(220,86,72,0.02) 100%)", borderBottom: "1px solid", borderColor: "divider" }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={1.2} alignItems={{ md: "center" }} justifyContent="space-between">
          <Box>
            <Typography variant="overline" sx={{ fontSize: "0.62rem", letterSpacing: "0.14em", color: "primary.main", fontWeight: 600 }}>Project Overview</Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.2 }}>Project Dashboard</Typography>
          </Box>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ sm: "center" }} sx={{ width: { xs: "100%", md: "auto" } }}>
            <FormControl size="small" sx={{ minWidth: { sm: 260 }, width: { xs: "100%", sm: "auto" } }}>
              <InputLabel>Project</InputLabel>
              <Select label="Project" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
                {projects.map((p) => (
                  <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              variant="contained"
              disableElevation
              sx={{ width: { xs: "100%", sm: "auto" }, borderRadius: 2 }}
              disabled={!projectId}
              onClick={async () => {
                if (!projectId) return;
                const res = await api.get(`/projects/${projectId}/report.pdf`, { responseType: "blob" });
                const url = URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
                const a = document.createElement("a");
                a.href = url;
                a.download = `inka_report_${projectId}.pdf`;
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              Download PDF Report
            </Button>
          </Stack>
        </Stack>
        </Box>

        {/* Summary metric cards */}
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, px: 2.5, py: 2, borderBottom: "1px solid", borderColor: "divider" }}>
          {[
            { label: "Change Request", value: openCr ? "Open" : "Clear", sub: openCr ? "Pending approval" : "All approved", color: G8.orange },
            { label: "Total Scope", value: `₹${Number(dashboard?.summary?.total_scope_value || 0).toLocaleString()}`, sub: "Approved BOM value", color: G8.orange },
            { label: "Delivered", value: `₹${Number(dashboard?.summary?.total_delivered_value || 0).toLocaleString()}`, sub: "Value on-site", color: G8.orange },
            { label: "Balance", value: `₹${Number(dashboard?.summary?.total_balance_value || 0).toLocaleString()}`, sub: "Remaining value", color: G8.orange },
            { label: "Site Visits", value: Number(dashboard?.summary?.visit_count || 0), sub: "Total logged", color: G8.orange },
          ].map(({ label, value, sub, color }) => (
            <Box key={label} sx={{ flex: "1 1 140px", minWidth: 130, p: 1.8, borderRadius: 2, border: "1px solid", borderColor: "divider", borderLeft: `3px solid ${color}`, bgcolor: "background.paper" }}>
              <Typography sx={{ fontSize: "0.62rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "text.secondary", mb: 0.4 }}>{label}</Typography>
              <Typography sx={{ fontSize: "1.15rem", fontWeight: 700, color, lineHeight: 1.25, mb: 0.3 }}>{value}</Typography>
              <Typography sx={{ fontSize: "0.67rem", color: "text.disabled" }}>{sub}</Typography>
            </Box>
          ))}
        </Box>

        <Box sx={{ px: 2.5, pb: 2.5 }}>

        {dashboard?.project ? (
          <Paper sx={{ mt: 2, p: 2, borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
            <Grid container spacing={1.5}>
              <Grid size={{ xs: 12, md: 3 }}><Typography sx={{ fontSize: "0.62rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "text.secondary", mb: 0.3 }}>Project</Typography><Typography variant="body2" sx={{ fontWeight: 600 }}>{dashboard.project.name}</Typography></Grid>
              <Grid size={{ xs: 12, md: 3 }}><Typography sx={{ fontSize: "0.62rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "text.secondary", mb: 0.3 }}>Client</Typography><Typography variant="body2" sx={{ fontWeight: 600 }}>{dashboard.project.client_name}</Typography></Grid>
              <Grid size={{ xs: 12, md: 3 }}><Typography sx={{ fontSize: "0.62rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "text.secondary", mb: 0.3 }}>Location</Typography><Typography variant="body2" sx={{ fontWeight: 600 }}>{dashboard.project.location}</Typography></Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <Typography variant="caption" color="text.secondary">Status</Typography>
                <Select
                  size="small"
                  value={dashboard.project.status}
                  onChange={async (e) => {
                    await api.patch(`/projects/${projectId}`, { status: e.target.value });
                    setToast({ open: true, severity: "success", text: "Status updated" });
                    await loadProject(projectId);
                    await fetchProjects();
                  }}
                  sx={{ display: "block", mt: 0.3 }}
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="on_hold">On Hold</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                </Select>
              </Grid>
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
            <Stack direction={{ xs: "column", md: "row" }} spacing={1} sx={{ mt: 1 }} alignItems={{ md: "center" }}>
              <Button variant="outlined" component="label" size="small">
                {driveUploadFile ? `Selected: ${driveUploadFile.name}` : "Select File For Drive"}
                <input hidden type="file" onChange={(e) => setDriveUploadFile(e.target.files?.[0] || null)} />
              </Button>
              <Button size="small" variant="contained" disabled={!driveUploadFile || driveUploading} onClick={uploadDriveFile}>
                {driveUploading ? "Uploading..." : "Upload To Google Drive"}
              </Button>
            </Stack>
            {driveFiles.length ? (
              <Stack spacing={0.5} sx={{ mt: 1 }}>
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
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
              <Box sx={{ width: 4, height: 20, borderRadius: 2, bgcolor: "primary.main" }} />
              <Typography variant="h6" sx={{ fontWeight: 700, fontSize: "1rem" }}>Project Contacts</Typography>
            </Box>
            <Stack spacing={0.8} sx={{ mt: 0.8 }}>
              {projectContacts.map((c, idx) => (
                <Stack key={`contact-${idx}`} direction={{ xs: "column", md: "row" }} spacing={1}>
                  <TextField size="small" label="Role" value={c.roleName || c.role_name || ""} onChange={(e) => setProjectContacts((prev) => prev.map((x, i) => i === idx ? { ...x, roleName: e.target.value } : x))} />
                  <TextField size="small" label="Name" value={c.contactName || c.contact_name || ""} onChange={(e) => setProjectContacts((prev) => prev.map((x, i) => i === idx ? { ...x, contactName: e.target.value } : x))} />
                  <TextField size="small" label="Phone" value={c.phone || ""} onChange={(e) => setProjectContacts((prev) => prev.map((x, i) => i === idx ? { ...x, phone: e.target.value } : x))} />
                  <TextField size="small" label="Email" value={c.email || ""} onChange={(e) => setProjectContacts((prev) => prev.map((x, i) => i === idx ? { ...x, email: e.target.value } : x))} />
                  <Tooltip title="Remove contact"><IconButton size="small" color="error" onClick={() => setProjectContacts((prev) => prev.filter((_, i) => i !== idx))}><DeleteOutlineIcon fontSize="small" /></IconButton></Tooltip>
                </Stack>
              ))}
              <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
                <Button size="small" variant="outlined" onClick={() => setProjectContacts((prev) => [...prev, { roleName: "Civil Engineer", contactName: "", phone: "", email: "", notes: "" }])}>Add Contact</Button>
                <Tooltip title="Save contacts"><IconButton color="success" onClick={saveContacts} sx={{ borderRadius: 1.5 }}><CheckCircleOutlineIcon fontSize="small" /></IconButton></Tooltip>
              </Stack>
            </Stack>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
              <Box sx={{ width: 4, height: 20, borderRadius: 2, bgcolor: "primary.main" }} />
              <Typography variant="h6" sx={{ fontWeight: 700, fontSize: "1rem" }}>Log Site Visit</Typography>
            </Box>
            <TextField
              label="Visit Notes"
              value={visitNotes}
              onChange={(e) => setVisitNotes(e.target.value)}
              fullWidth
              multiline
              minRows={3}
              sx={{ mb: 1 }}
            />
            <Button variant="contained" onClick={logVisit}>Log Site Visit</Button>
            <Stack spacing={0.8} sx={{ mt: 1.2 }}>
              {visits.slice(0, 5).map((v) => (
                <Box key={v.id} sx={{ display: "flex", gap: 1.2, alignItems: "flex-start" }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "primary.main", mt: "5px", flexShrink: 0 }} />
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 500, lineHeight: 1.3 }}>{v.notes || "Site visit logged"}</Typography>
                    <Typography variant="caption" color="text.secondary">{new Date(v.created_at).toLocaleString()} · {v.engineer_name || "Engineer"}</Typography>
                  </Box>
                </Box>
              ))}
            </Stack>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
              <Box sx={{ width: 4, height: 20, borderRadius: 2, bgcolor: "primary.main" }} />
              <Typography variant="h6" sx={{ fontWeight: 700, fontSize: "1rem" }}>Visit Analytics</Typography>
            </Box>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, mb: 2 }}>
              {[
                { label: "Total Visits", value: Number(visitSummary?.totals?.total_visits || 0), color: G8.orange },
                { label: "Engineers", value: Number(visitSummary?.totals?.engineer_count || 0), color: G8.orange },
                { label: "First Visit", value: visitSummary?.totals?.first_visit_date || "—", color: G8.orange },
                { label: "Last Visit", value: visitSummary?.totals?.last_visit_date || "—", color: G8.orange },
              ].map(({ label, value, color }) => (
                <Box key={label} sx={{ flex: "1 1 120px", minWidth: 110, p: 1.8, borderRadius: 2, border: "1px solid", borderColor: "divider", borderTop: `3px solid ${color}`, textAlign: "center" }}>
                  <Typography sx={{ fontSize: "1.3rem", fontWeight: 800, color, lineHeight: 1.2 }}>{value}</Typography>
                  <Typography sx={{ fontSize: "0.67rem", color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.08em", mt: 0.3 }}>{label}</Typography>
                </Box>
              ))}
            </Box>
            <Grid container spacing={1.5} sx={{ mb: 1 }}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Paper sx={{ p: 1.8, borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
                  <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "text.secondary", mb: 1.2 }}>Engineer-wise Visits</Typography>
                  <Stack spacing={1}>
                    {(visitSummary?.byEngineer || []).map((r) => {
                      const maxV = Math.max(...(visitSummary?.byEngineer || []).map((x) => x.visit_count), 1);
                      return (
                        <Box key={r.engineer_id || r.engineer_name}>
                          <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.3 }}>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>{r.engineer_name}</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: "primary.main" }}>{r.visit_count}</Typography>
                          </Stack>
                          <Box sx={{ height: 6, borderRadius: 3, bgcolor: (t) => t.palette.mode === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.07)", overflow: "hidden" }}>
                            <Box sx={{ height: "100%", width: `${(r.visit_count / maxV) * 100}%`, bgcolor: "primary.main", borderRadius: 3, transition: "width 0.5s ease" }} />
                          </Box>
                        </Box>
                      );
                    })}
                  </Stack>
                </Paper>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Paper sx={{ p: 1.8, borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
                  <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "text.secondary", mb: 1.2 }}>Month-wise Visits</Typography>
                  <Stack spacing={1}>
                    {(visitSummary?.byMonth || []).map((r) => {
                      const maxV = Math.max(...(visitSummary?.byMonth || []).map((x) => x.visit_count), 1);
                      return (
                        <Box key={r.month_key}>
                          <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.3 }}>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>{r.month_key}</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: "primary.main" }}>{r.visit_count}</Typography>
                          </Stack>
                          <Box sx={{ height: 6, borderRadius: 3, bgcolor: (t) => t.palette.mode === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.07)", overflow: "hidden" }}>
                            <Box sx={{ height: "100%", width: `${(r.visit_count / maxV) * 100}%`, bgcolor: "primary.main", borderRadius: 3, transition: "width 0.5s ease" }} />
                          </Box>
                        </Box>
                      );
                    })}
                  </Stack>
                </Paper>
              </Grid>
            </Grid>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
              <Box sx={{ width: 4, height: 20, borderRadius: 2, bgcolor: "primary.main" }} />
              <Typography variant="h6" sx={{ fontWeight: 700, fontSize: "1rem" }}>Activity Feed</Typography>
            </Box>
            <Stack spacing={0}>
              {activity.slice(0, 8).map((a, idx) => {
                const actionColor = G8.orange;
                return (
                  <Box key={a.id} sx={{ display: "flex", gap: 1.5, position: "relative" }}>
                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                      <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: actionColor, mt: "4px", zIndex: 1, flexShrink: 0 }} />
                      {idx < Math.min(activity.length, 8) - 1 && <Box sx={{ width: 2, flex: 1, bgcolor: (t) => t.palette.mode === "dark" ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.1)", my: 0.3 }} />}
                    </Box>
                    <Box sx={{ pb: 1.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: actionColor, fontSize: "0.8rem" }}>{a.action_type?.replace(/_/g, " ")}</Typography>
                      <Typography variant="caption" color="text.secondary">{new Date(a.created_at).toLocaleString()}{a.user_name ? ` · ${a.user_name}` : ""}</Typography>
                    </Box>
                  </Box>
                );
              })}
            </Stack>
          </Paper>
        ) : null}
        </Box>
      </Paper>

      <Paper sx={{ p: 1 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable">
          <Tab label="BOM" />
          <Tab label="Change Requests" />
          <Tab label="Deliveries" />
        </Tabs>
      </Paper>

      {loading ? <CircularProgress sx={{ mt: 2 }} /> : null}

      {tab === 0 && (
        <Zoom in timeout={350}>
          <Box sx={{ mt: 2 }}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} justifyContent="space-between" sx={{ mb: 1.5 }}>
              <Typography variant="h6">Structured BOM</Typography>
              <Button startIcon={<AddIcon />} variant="contained" disabled>
                Add Item via CR
              </Button>
            </Stack>
            {grouped.map(([category, rows]) => (
              <Accordion key={category} sx={{ mb: 1 }} defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Stack direction="row" alignItems="center" spacing={1.2}>
                    <Typography sx={{ fontWeight: 700 }}>{category}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ bgcolor: "action.hover", px: 1, py: 0.2, borderRadius: 1 }}>{rows.length} item{rows.length !== 1 ? "s" : ""}</Typography>
                  </Stack>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={1}>
                    {rows.map((r) => (
                      <Grid size={{ xs: 12, md: 6 }} key={r.id}>
                        <Paper sx={{ p: 1.5, border: `1px solid ${theme.palette.divider}` }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{r.brand_name} {r.model_number}</Typography>
                          <Typography variant="caption" color="text.secondary">{r.product_type_name}</Typography>
                          <Typography variant="caption" display="block" color="text.secondary">Location: {r.location_description || "-"}</Typography>
                          <Divider sx={{ my: 1 }} />
                          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                            <Chip label={`Approved ${r.quantity}`} size="small" color="primary" />
                            <Chip label={`Delivered ${r.delivered_quantity}`} size="small" color="success" />
                            <Chip label={`Balance ${Number(r.quantity) - Number(r.delivered_quantity)}`} size="small" color="warning" />
                          </Stack>
                          <Box sx={{ mt: 1.5 }}>
                            <ItemProgressRow item={r} />
                          </Box>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        </Zoom>
      )}

      {tab === 1 && (
        <Paper sx={{ mt: 2, p: 2 }}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} justifyContent="space-between" alignItems={{ sm: "center" }} sx={{ mb: 1.5 }}>
            <Typography variant="h6">Single Change Request Governance</Typography>
            {!openCr ? (
              <Button variant="contained" startIcon={<CompareArrowsIcon />} onClick={createCr} disabled={!projectId || !canEditScope}>Create Change Request</Button>
            ) : (
              <Chip label={`CR ${openCr.id.slice(0, 8)} | ${openCr.status.toUpperCase()}`} color="warning" />
            )}
          </Stack>

          {openCr && openCr.status !== "pending" && canEditScope ? (
            <Stack spacing={1.5}>
              <Button variant="contained" onClick={() => setOpenAdd(true)} startIcon={<AddIcon />}>
                Add Item (CR)
              </Button>
              <HierarchySelector
                categories={masterData.categories}
                productTypes={masterData.productTypes}
                brands={masterData.brands}
                items={masterData.items}
                value={crSelector}
                onChange={(change) => setCrSelector((prev) => ({ ...prev, ...change }))}
              />
              <Stack direction={{ xs: "column", md: "row" }} spacing={1.2}>
                <FormControl fullWidth>
                  <InputLabel>Change Type</InputLabel>
                  <Select value={crChangeType} label="Change Type" onChange={(e) => setCrChangeType(e.target.value)}>
                    <MenuItem value="add">Add</MenuItem>
                    <MenuItem value="modify">Modify Quantity</MenuItem>
                    <MenuItem value="delete">Delete</MenuItem>
                  </Select>
                </FormControl>
                <TextField type="number" label="New Quantity" value={crQty} onChange={(e) => setCrQty(Number(e.target.value || 0))} disabled={crChangeType === "delete"} fullWidth />
                <TextField label="Floor" value={crFloorLabel} onChange={(e) => setCrFloorLabel(e.target.value)} fullWidth />
                <TextField label="Location Description" value={crLocationDescription} onChange={(e) => setCrLocationDescription(e.target.value)} fullWidth />
                <Button variant="contained" onClick={addCrItem}>Add Delta</Button>
                <Button variant="outlined" onClick={submitCr}>Submit CR</Button>
              </Stack>
            </Stack>
          ) : null}

          {openCr && openCr.status === "pending" && (role === "project_manager" || role === "admin") ? (
            <Stack direction="row" spacing={1.2} sx={{ mt: 1.2 }}>
              <Button variant="contained" color="success" onClick={approveCr}>Approve CR</Button>
              <Button variant="outlined" color="error" onClick={rejectCr}>Reject CR</Button>
            </Stack>
          ) : null}

          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid size={{ xs: 12, md: 7 }}>
              <Typography variant="body2">CR changes are delta-based and applied only on approval.</Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 5 }}>
              <Paper sx={{ p: 1.5, bgcolor: "action.hover" }}>
                <Typography variant="subtitle2">Live Diff Panel</Typography>
                <Typography variant="caption" color="text.secondary">
                  Total Scope Qty Delta: {crDiff.summary?.totalDeltaQty ?? 0}
                </Typography>
                <Table size="small" sx={{ mt: 1 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Model</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Floor</TableCell>
                      <TableCell align="right">Before</TableCell>
                      <TableCell align="right">After</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(crDiff.diff || []).map((d) => (
                      <TableRow key={`${d.itemId}-${d.changeType}`}>
                        <TableCell>{d.modelNumber}</TableCell>
                        <TableCell>{d.changeType}</TableCell>
                        <TableCell>{d.floorLabel || "Unassigned"}</TableCell>
                        <TableCell align="right">{d.beforeQty}</TableCell>
                        <TableCell align="right">{d.afterQty}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Paper>
            </Grid>
          </Grid>
        </Paper>
      )}

      {tab === 2 && (
        <Paper sx={{ mt: 2, p: 2 }}>
          <Typography variant="h6">Site Deliveries</Typography>
          <Grid container spacing={1.2} sx={{ mt: 1.2 }}>
            <Grid size={{ xs: 12 }}>
              <HierarchySelector
                categories={masterData.categories}
                productTypes={masterData.productTypes}
                brands={masterData.brands}
                items={masterData.items.filter((x) => (dashboard?.bom || []).some((b) => b.item_id === x.id))}
                value={deliverySelector}
                onChange={(change) => setDeliverySelector((prev) => ({ ...prev, ...change }))}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 2 }}>
              <TextField type="number" label="Delivered Qty" value={deliveryQty} onChange={(e) => setDeliveryQty(Number(e.target.value || 0))} fullWidth />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField label="Notes" value={deliveryNotes} onChange={(e) => setDeliveryNotes(e.target.value)} fullWidth />
            </Grid>
            <Grid size={{ xs: 6, md: 2 }}>
              <Button fullWidth variant="outlined" component="label">
                {deliveryPhotoFile ? "Photo Selected" : "Upload Photo"}
                <input hidden type="file" accept="image/*" onChange={(e) => setDeliveryPhotoFile(e.target.files?.[0] || null)} />
              </Button>
            </Grid>
            <Grid size={{ xs: 6, md: 2 }}>
              <Button fullWidth variant="contained" onClick={logDelivery}>Log</Button>
            </Grid>
          </Grid>
          {selectedDeliveryBom ? (
            <Stack direction="row" spacing={1} sx={{ mt: 1.2 }}>
              <Chip label={`Approved ${selectedDeliveryBom.quantity}`} size="small" />
              <Chip label={`Previously Delivered ${selectedDeliveryBom.delivered_quantity}`} size="small" color="success" />
              <Chip label={`Balance ${Number(selectedDeliveryBom.quantity) - Number(selectedDeliveryBom.delivered_quantity)}`} size="small" color="warning" />
            </Stack>
          ) : null}

          <Stack spacing={1} sx={{ mt: 2 }}>
            {deliveries.slice(0, 8).map((d) => (
              <Paper key={d.id} sx={{ p: 1.2, border: `1px solid ${theme.palette.divider}` }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{d.full_name}</Typography>
                <Typography variant="caption" color="text.secondary">
                  Qty {d.quantity} | {new Date(d.created_at).toLocaleString()} | {d.engineer_name || "Unknown"}
                </Typography>
                <Typography variant="caption" display="block" color="text.secondary">
                  Notes: {d.notes || "-"} | Photo: {d.photo_url || "-"}
                </Typography>
              </Paper>
            ))}
          </Stack>
        </Paper>
      )}

      </>
      )}

      {viewMode === "list" && outerTab === 2 && (
        <Paper sx={{ p: 2, mt: 1.5 }}>
          <Typography variant="h6">Reports</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2 }}>
            Select a project to download its PDF report.
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ sm: "center" }} flexWrap="wrap" useFlexGap>
            <Autocomplete
              size="small"
              sx={{ minWidth: 320 }}
              options={reportOptions}
              loading={reportLoading}
              value={selectedReportProject}
              onChange={(_, newVal) => { setSelectedReportProject(newVal); setReportPage(1); }}
              onOpen={() => { if (!reportOptions.length) fetchReportOptions(""); }}
              onInputChange={(_, val) => { setReportSearch(val); fetchReportOptions(val); setReportPage(1); }}
              getOptionLabel={(p) => p ? `${p.name} — ${p.client_name || "No client"}` : ""}
              isOptionEqualToValue={(o, v) => o.id === v.id}
              renderInput={(params) => <TextField {...params} label="Search & select project" />}
            />
            <Button
              variant="contained"
              disabled={!selectedReportProject}
              onClick={async () => {
                if (!selectedReportProject) return;
                const res = await api.get(`/projects/${selectedReportProject.id}/report.pdf`, { responseType: "blob" });
                const url = URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
                const a = document.createElement("a");
                a.href = url;
                a.download = `inka_report_${selectedReportProject.id}.pdf`;
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              Download PDF Report
            </Button>
          </Stack>
          {reportOptions.length > 0 && (
            <>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 2, mb: 1 }} flexWrap="wrap" useFlexGap>
                <Button size="small" disabled={reportPage <= 1} onClick={() => setReportPage((p) => Math.max(1, p - 1))}>Prev</Button>
                <Typography variant="caption" color="text.secondary">Page {reportPage} / {reportTotalPages}</Typography>
                <Button size="small" disabled={reportPage >= reportTotalPages} onClick={() => setReportPage((p) => Math.min(reportTotalPages, p + 1))}>Next</Button>
              </Stack>
              <TableContainer sx={{ mt: 1 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Project</TableCell>
                      <TableCell>Client</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Download</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pagedReportRows.map((p) => (
                      <TableRow key={p.id} hover>
                        <TableCell>{p.name}</TableCell>
                        <TableCell>{p.client_name || "-"}</TableCell>
                        <TableCell><Chip label={p.status} size="small" /></TableCell>
                        <TableCell>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={async () => {
                              const res = await api.get(`/projects/${p.id}/report.pdf`, { responseType: "blob" });
                              const url = URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
                              const a = document.createElement("a");
                              a.href = url;
                              a.download = `inka_report_${p.id}.pdf`;
                              a.click();
                              URL.revokeObjectURL(url);
                            }}
                          >
                            PDF
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                Showing {Math.min(reportPageSize, reportOptions.length - (reportPage - 1) * reportPageSize)} of {reportOptions.length} projects{reportSearch ? ` matching "${reportSearch}"` : ""}.
              </Typography>
            </>
          )}
        </Paper>
      )}

      <Dialog open={openAdd} onClose={() => setOpenAdd(false)} fullWidth maxWidth="md">
        <DialogTitle>Add BOM Item</DialogTitle>
        <DialogContent>
          <HierarchySelector
            categories={masterData.categories}
            productTypes={masterData.productTypes}
            brands={masterData.brands}
            items={masterData.items}
            value={selector}
            onChange={(change) => setSelector((prev) => ({ ...prev, ...change }))}
          />
          <Grid container spacing={1.2} sx={{ mt: 0.6 }}>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField type="number" label="Quantity" fullWidth value={qty} onChange={(e) => setQty(Number(e.target.value || 0))} />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField type="number" label="Rate" fullWidth value={rate} onChange={(e) => setRate(Number(e.target.value || 0))} />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField label="Unit" fullWidth value={selectedModel?.unit_of_measure || "-"} disabled />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField label="Floor (GF / FF / etc)" fullWidth value={floorLabel} onChange={(e) => setFloorLabel(e.target.value)} />
            </Grid>
            <Grid size={{ xs: 12, md: 8 }}>
              <TextField label="Location Description" fullWidth value={locationDescription} onChange={(e) => setLocationDescription(e.target.value)} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAdd(false)} startIcon={<HighlightOffIcon />}>Cancel</Button>
          <Button variant="contained" color="success" startIcon={<CheckCircleOutlineIcon />} onClick={addBomItem}>Save</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openCreateProject} onClose={() => setOpenCreateProject(false)} fullWidth maxWidth="md">
        <DialogTitle>Create Project</DialogTitle>
        <DialogContent>
          <Grid container spacing={1.2} sx={{ mt: 0.2 }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField label="Project Name" fullWidth value={newProject.name} onChange={(e) => setNewProject((p) => ({ ...p, name: e.target.value }))} />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Client</InputLabel>
                <Select
                  label="Client"
                  value={newProject.clientId}
                  onChange={(e) => {
                    const selected = clientMasters.find((c) => c.id === e.target.value);
                    setNewProject((p) => ({
                      ...p,
                      clientId: e.target.value,
                      clientName: selected?.name || "",
                      location: selected?.location || p.location,
                    }));
                  }}
                >
                  <MenuItem value="">None</MenuItem>
                  {clientMasters.filter((c) => c.is_active).map((c) => (
                    <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField label="Location" fullWidth value={newProject.location} onChange={(e) => setNewProject((p) => ({ ...p, location: e.target.value }))} />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField label="Drive Link (Optional)" fullWidth value={newProject.driveLink} onChange={(e) => setNewProject((p) => ({ ...p, driveLink: e.target.value }))} />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField type="date" label="Start Date" fullWidth slotProps={{ inputLabel: { shrink: true } }} value={newProject.startDate} onChange={(e) => setNewProject((p) => ({ ...p, startDate: e.target.value }))} />
            </Grid>
            <Grid size={{ xs: 12, md: 8 }}>
              <FormControl fullWidth>
                <InputLabel>Assigned Engineers</InputLabel>
                <Select
                  multiple
                  label="Assigned Engineers"
                  value={newProject.engineerIds}
                  onChange={(e) => setNewProject((p) => ({ ...p, engineerIds: e.target.value }))}
                >
                  {engineers.map((u) => (
                    <MenuItem key={u.id} value={u.id}>{u.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <FormControl fullWidth>
                <InputLabel>Category Sequence Mode</InputLabel>
                <Select
                  label="Category Sequence Mode"
                  value={newProject.categorySequenceMode ? "yes" : "no"}
                  onChange={(e) => setNewProject((p) => ({ ...p, categorySequenceMode: e.target.value === "yes" }))}
                >
                  <MenuItem value="no">Disabled</MenuItem>
                  <MenuItem value="yes">Enabled</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreateProject(false)} startIcon={<HighlightOffIcon />}>Cancel</Button>
          <Button variant="contained" color="success" startIcon={<CheckCircleOutlineIcon />} onClick={createProject}>Save</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={editProjectOpen} onClose={() => setEditProjectOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>Edit Project</DialogTitle>
        <DialogContent>
          <Grid container spacing={1.2} sx={{ mt: 0.2 }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField label="Project Name" fullWidth value={editProjectForm.name} onChange={(e) => setEditProjectForm((p) => ({ ...p, name: e.target.value }))} />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Client</InputLabel>
                <Select
                  label="Client"
                  value={editProjectForm.clientId}
                  onChange={(e) => {
                    const selected = clientMasters.find((c) => c.id === e.target.value);
                    setEditProjectForm((p) => ({
                      ...p,
                      clientId: e.target.value,
                      clientName: selected?.name || "",
                      location: selected?.location || p.location,
                    }));
                  }}
                >
                  <MenuItem value="">None</MenuItem>
                  {clientMasters.filter((c) => c.is_active).map((c) => (
                    <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField label="Location" fullWidth value={editProjectForm.location} onChange={(e) => setEditProjectForm((p) => ({ ...p, location: e.target.value }))} />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField label="Drive Link (Optional)" fullWidth value={editProjectForm.driveLink} onChange={(e) => setEditProjectForm((p) => ({ ...p, driveLink: e.target.value }))} />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField type="date" label="Start Date" fullWidth slotProps={{ inputLabel: { shrink: true } }} value={editProjectForm.startDate} onChange={(e) => setEditProjectForm((p) => ({ ...p, startDate: e.target.value }))} />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Assigned Engineers</InputLabel>
                <Select multiple label="Assigned Engineers" value={editProjectForm.engineerIds} onChange={(e) => setEditProjectForm((p) => ({ ...p, engineerIds: e.target.value }))}>
                  {engineers.map((u) => (
                    <MenuItem key={u.id} value={u.id}>{u.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <FormControl fullWidth>
                <InputLabel>Category Sequence Mode</InputLabel>
                <Select label="Category Sequence Mode" value={editProjectForm.categorySequenceMode ? "yes" : "no"} onChange={(e) => setEditProjectForm((p) => ({ ...p, categorySequenceMode: e.target.value === "yes" }))}>
                  <MenuItem value="no">Disabled</MenuItem>
                  <MenuItem value="yes">Enabled</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditProjectOpen(false)} startIcon={<HighlightOffIcon />}>Cancel</Button>
          <Button variant="contained" color="success" startIcon={<CheckCircleOutlineIcon />} onClick={() => saveEditProject().catch(() => setToast({ open: true, severity: "error", text: "Update project failed" }))}>Save</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteProjectOpen} onClose={() => setDeleteProjectOpen(false)} maxWidth="xs">
        <DialogTitle>Delete Project</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this project? This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteProjectOpen(false)} startIcon={<HighlightOffIcon />}>Cancel</Button>
          <Button variant="contained" color="error" startIcon={<DeleteOutlineIcon />} onClick={() => confirmDeleteProject().catch(() => setToast({ open: true, severity: "error", text: "Delete project failed" }))}>Delete</Button>
        </DialogActions>
      </Dialog>

      <AppToast toast={toast} onClose={() => setToast((p) => ({ ...p, open: false }))} />
    </Box>
    </Fade>
  );
}
