import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Collapse,
  Divider,
  FormControl,
  FormControlLabel,
  Grid2 as Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Switch,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  Tabs,
  TextField,
  Typography,
  Fade,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import KpiCard from "../components/KpiCard";
import { api } from "../api/client";

export default function AdminView() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const PAGE_SIZE = 25;
  const MAX_RENDER_ROWS = 200;
  const [tab, setTab] = useState(0);
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [categories, setCategories] = useState([]);
  const [productTypes, setProductTypes] = useState([]);
  const [brands, setBrands] = useState([]);
  const [items, setItems] = useState([]);
  const [users, setUsers] = useState([]);
  const [engineers, setEngineers] = useState([]);
  const [clientUsers, setClientUsers] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [selectedProjectDashboard, setSelectedProjectDashboard] = useState(null);
  const [selectedProjectActivity, setSelectedProjectActivity] = useState([]);
  const [selectedProjectVisitSummary, setSelectedProjectVisitSummary] = useState({
    totals: {},
    byEngineer: [],
    byMonth: [],
  });
  const [selectedProjectDriveFiles, setSelectedProjectDriveFiles] = useState([]);
  const [selectedProjectUploadFile, setSelectedProjectUploadFile] = useState(null);
  const [selectedProjectUploading, setSelectedProjectUploading] = useState(false);
  const [projectDetailsLoading, setProjectDetailsLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [editCategory, setEditCategory] = useState({});
  const [editProductType, setEditProductType] = useState({});
  const [editBrand, setEditBrand] = useState({});
  const [editItem, setEditItem] = useState({});
  const [editingProductTypeId, setEditingProductTypeId] = useState(null);
  const [productTypePage, setProductTypePage] = useState(1);
  const [projectPage, setProjectPage] = useState(1);
  const [userPage, setUserPage] = useState(1);
  const [clientPage, setClientPage] = useState(1);
  const [projectPagination, setProjectPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [userPagination, setUserPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [clientPagination, setClientPagination] = useState({ page: 1, totalPages: 1, total: 0 });

  const [catForm, setCatForm] = useState({ name: "", sequenceOrder: 1, isActive: true });
  const [ptForm, setPtForm] = useState({ name: "", categoryId: "", isActive: true });
  const [brandForm, setBrandForm] = useState({ name: "", isActive: true });
  const [itemForm, setItemForm] = useState({
    categoryId: "",
    productTypeId: "",
    brandId: "",
    modelNumber: "",
    fullName: "",
    unitOfMeasure: "Nos",
    defaultRate: 0,
    specificationsText: "{}",
    isActive: true,
  });
  const [userForm, setUserForm] = useState({
    name: "",
    email: "",
    role: "engineer",
    password: "Inka@123",
    isActive: true,
  });
  const [clientForm, setClientForm] = useState({
    name: "",
    location: "",
    primaryContactName: "",
    primaryContactPhone: "",
    primaryContactEmail: "",
    notes: "",
    isActive: true,
  });
  const [editClient, setEditClient] = useState({});
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [creatingProject, setCreatingProject] = useState(false);
  const [excelImportFile, setExcelImportFile] = useState(null);
  const [excelImporting, setExcelImporting] = useState(false);
  const [excelImportResult, setExcelImportResult] = useState(null);
  const [projectForm, setProjectForm] = useState({
    name: "",
    clientId: "",
    clientName: "",
    location: "",
    driveLink: "",
    startDate: new Date().toISOString().slice(0, 10),
    engineerIds: [],
    clientUserIds: [],
    categorySequenceMode: false,
  });

  async function loadAll() {
    const [p, c, pt, b, i, u, a, cl, eng, cliUsers] = await Promise.all([
      api.get("/projects", { params: { paginated: true, page: projectPage, limit: PAGE_SIZE } }),
      api.get("/admin/categories"),
      api.get("/admin/product-types"),
      api.get("/admin/brands"),
      api.get("/admin/items"),
      api.get("/admin/users", { params: { paginated: true, page: userPage, limit: PAGE_SIZE } }),
      api.get("/admin/activity/recent"),
      api.get("/clients", { params: { paginated: true, page: clientPage, limit: PAGE_SIZE } }),
      api.get("/reference/users?role=engineer"),
      api.get("/reference/users?role=client"),
    ]);
    setProjects(Array.isArray(p.data) ? p.data : p.data.data || []);
    setProjectPagination(
      Array.isArray(p.data)
        ? { page: 1, totalPages: 1, total: p.data.length }
        : p.data.pagination || { page: 1, totalPages: 1, total: 0 }
    );
    setCategories(c.data);
    setProductTypes(pt.data);
    setBrands(b.data);
    setItems(i.data);
    setUsers(Array.isArray(u.data) ? u.data : u.data.data || []);
    setUserPagination(
      Array.isArray(u.data)
        ? { page: 1, totalPages: 1, total: u.data.length }
        : u.data.pagination || { page: 1, totalPages: 1, total: 0 }
    );
    setRecentActivity(a.data);
    setClients(Array.isArray(cl.data) ? cl.data : cl.data.data || []);
    setClientPagination(
      Array.isArray(cl.data)
        ? { page: 1, totalPages: 1, total: cl.data.length }
        : cl.data.pagination || { page: 1, totalPages: 1, total: 0 }
    );
    setEngineers(eng.data);
    setClientUsers(cliUsers.data);
    const projectsRows = Array.isArray(p.data) ? p.data : p.data.data || [];
    if (!selectedProjectId && projectsRows.length) {
      setSelectedProjectId(projectsRows[0].id);
    }
  }

  async function loadProjectDetails(projectId) {
    if (!projectId) return;
    setProjectDetailsLoading(true);
    try {
      const [dashboardRes, activityRes, visitSummaryRes] = await Promise.all([
        api.get(`/projects/${projectId}/dashboard`),
        api.get(`/projects/${projectId}/activity`),
        api.get(`/projects/${projectId}/visits/summary`).catch(() => ({
          data: { totals: {}, byEngineer: [], byMonth: [] },
        })),
      ]);
      setSelectedProjectDashboard(dashboardRes.data);
      setSelectedProjectActivity(activityRes.data || []);
      setSelectedProjectVisitSummary(visitSummaryRes.data || { totals: {}, byEngineer: [], byMonth: [] });
      const driveRes = await api.get(`/projects/${projectId}/drive-files`).catch(() => ({ data: [] }));
      setSelectedProjectDriveFiles(driveRes.data || []);
    } finally {
      setProjectDetailsLoading(false);
    }
  }

  async function uploadProjectDriveFile(projectId) {
    if (!projectId || !selectedProjectUploadFile) return;
    setSelectedProjectUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", selectedProjectUploadFile);
      fd.append("projectId", projectId);
      await api.post("/uploads/drive", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setSelectedProjectUploadFile(null);
      setNotice("File uploaded to Google Drive");
      await loadProjectDetails(projectId);
    } catch (e) {
      setNotice(e?.response?.data?.error || "Drive upload failed");
    } finally {
      setSelectedProjectUploading(false);
    }
  }

  useEffect(() => {
    loadAll().catch(() => setNotice("Failed to load admin data"));
  }, [projectPage, userPage, clientPage]);

  useEffect(() => {
    if (!selectedProjectId) return;
    setSelectedProjectUploadFile(null);
    loadProjectDetails(selectedProjectId).catch(() => setNotice("Failed to load selected project details"));
  }, [selectedProjectId]);

  const openCrCount = useMemo(() => projects.filter((p) => p.has_open_cr).length, [projects]);
  const filteredPT = productTypes.filter((x) => x.category_id === itemForm.categoryId);
  const productTypePageSize = 50;
  const productTypeTotalPages = Math.max(1, Math.ceil(productTypes.length / productTypePageSize));
  const pagedProductTypes = useMemo(() => {
    const start = (productTypePage - 1) * productTypePageSize;
    return productTypes.slice(start, start + productTypePageSize);
  }, [productTypes, productTypePage]);

  async function createCategory() {
    await api.post("/admin/categories", {
      name: catForm.name,
      sequenceOrder: Number(catForm.sequenceOrder),
      isActive: !!catForm.isActive,
    });
    setCatForm({ name: "", sequenceOrder: 1, isActive: true });
    setNotice("Category added");
    await loadAll();
  }

  async function createProductType() {
    await api.post("/admin/product-types", {
      categoryId: ptForm.categoryId,
      name: ptForm.name,
      isActive: !!ptForm.isActive,
    });
    setPtForm({ name: "", categoryId: "", isActive: true });
    setNotice("Product type added");
    await loadAll();
  }

  async function createBrand() {
    await api.post("/admin/brands", { name: brandForm.name, isActive: !!brandForm.isActive });
    setBrandForm({ name: "", isActive: true });
    setNotice("Brand added");
    await loadAll();
  }

  async function createModel() {
    let specs = {};
    try {
      specs = JSON.parse(itemForm.specificationsText || "{}");
    } catch {
      setNotice("Specifications must be valid JSON");
      return;
    }
    await api.post("/admin/items", {
      categoryId: itemForm.categoryId,
      productTypeId: itemForm.productTypeId,
      brandId: itemForm.brandId,
      modelNumber: itemForm.modelNumber,
      fullName: itemForm.fullName,
      unitOfMeasure: itemForm.unitOfMeasure,
      defaultRate: Number(itemForm.defaultRate),
      specifications: specs,
      isActive: !!itemForm.isActive,
    });
    setItemForm({
      categoryId: "",
      productTypeId: "",
      brandId: "",
      modelNumber: "",
      fullName: "",
      unitOfMeasure: "Nos",
      defaultRate: 0,
      specificationsText: "{}",
      isActive: true,
    });
    setNotice("Model added");
    await loadAll();
  }

  async function toggleCategory(c) {
    await api.patch(`/admin/categories/${c.id}`, { isActive: !c.is_active });
    await loadAll();
  }
  async function toggleProductType(pt) {
    await api.patch(`/admin/product-types/${pt.id}`, { isActive: !pt.is_active });
    await loadAll();
  }
  async function toggleBrand(b) {
    await api.patch(`/admin/brands/${b.id}`, { isActive: !b.is_active });
    await loadAll();
  }
  async function toggleItem(i) {
    await api.patch(`/admin/items/${i.id}`, { isActive: !i.is_active });
    await loadAll();
  }

  async function saveCategory(id) {
    await api.patch(`/admin/categories/${id}`, editCategory[id] || {});
    setEditCategory((prev) => ({ ...prev, [id]: undefined }));
    await loadAll();
  }
  async function saveProductType(id) {
    await api.patch(`/admin/product-types/${id}`, editProductType[id] || {});
    setEditProductType((prev) => ({ ...prev, [id]: undefined }));
    setEditingProductTypeId(null);
    await loadAll();
  }
  async function saveBrand(id) {
    await api.patch(`/admin/brands/${id}`, editBrand[id] || {});
    setEditBrand((prev) => ({ ...prev, [id]: undefined }));
    await loadAll();
  }
  async function saveItem(id) {
    await api.patch(`/admin/items/${id}`, editItem[id] || {});
    setEditItem((prev) => ({ ...prev, [id]: undefined }));
    await loadAll();
  }
  async function deleteCategory(id) {
    try {
      await api.delete(`/admin/categories/${id}`);
      setNotice("Category deleted");
      await loadAll();
    } catch (e) {
      setNotice(e?.response?.data?.error || "Delete category failed");
    }
  }
  async function deleteProductType(id) {
    try {
      await api.delete(`/admin/product-types/${id}`);
      setNotice("Product type deleted");
      await loadAll();
    } catch (e) {
      setNotice(e?.response?.data?.error || "Delete product type failed");
    }
  }
  async function deleteBrand(id) {
    try {
      await api.delete(`/admin/brands/${id}`);
      setNotice("Brand deleted");
      await loadAll();
    } catch (e) {
      setNotice(e?.response?.data?.error || "Delete brand failed");
    }
  }
  async function deleteItem(id) {
    try {
      await api.delete(`/admin/items/${id}`);
      setNotice("Model deleted");
      await loadAll();
    } catch (e) {
      setNotice(e?.response?.data?.error || "Delete model failed");
    }
  }
  async function deleteUser(id) {
    await api.delete(`/admin/users/${id}`);
    setNotice("User deleted");
    await loadAll();
  }
  async function createClient() {
    await api.post("/clients", clientForm);
    setClientForm({
      name: "",
      location: "",
      primaryContactName: "",
      primaryContactPhone: "",
      primaryContactEmail: "",
      notes: "",
      isActive: true,
    });
    setNotice("Client added");
    await loadAll();
  }
  async function saveClient(id) {
    await api.patch(`/clients/${id}`, editClient[id] || {});
    setEditClient((prev) => ({ ...prev, [id]: undefined }));
    setNotice("Client updated");
    await loadAll();
  }
  async function deleteClient(id) {
    await api.delete(`/clients/${id}`);
    setNotice("Client deleted");
    await loadAll();
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
      setNotice(`Excel imported: ${res.data.projectsImported} projects, ${res.data.itemsCreated} items created`);
      setExcelImportFile(null);
      await loadAll();
    } catch (e) {
      setNotice(e?.response?.data?.error || "Excel import failed");
    } finally {
      setExcelImporting(false);
    }
  }

  async function createProjectFromAdmin() {
    setCreatingProject(true);
    try {
      await api.post("/projects", {
        name: projectForm.name,
        clientId: projectForm.clientId || undefined,
        clientName: projectForm.clientName,
        location: projectForm.location,
        driveLink: projectForm.driveLink,
        startDate: projectForm.startDate,
        engineerIds: projectForm.engineerIds,
        clientUserIds: projectForm.clientUserIds,
        categorySequenceMode: !!projectForm.categorySequenceMode,
      });
      setNotice("Project created");
      setProjectForm({
        name: "",
        clientId: "",
        clientName: "",
        location: "",
        driveLink: "",
        startDate: new Date().toISOString().slice(0, 10),
        engineerIds: [],
        clientUserIds: [],
        categorySequenceMode: false,
      });
      setShowCreateProject(false);
      setProjectPage(1);
      await loadAll();
    } finally {
      setCreatingProject(false);
    }
  }

  return (
    <Fade in timeout={420}>
      <Box
        sx={{
          "& .admin-table-scroll": { overflowX: "auto", width: "100%" },
          "& .MuiTable-root": { minWidth: { xs: 640, md: "100%" } },
          "& .MuiTableCell-root": {
            px: { xs: 1, sm: 1.5 },
            py: { xs: 0.8, sm: 1.05 },
            fontSize: { xs: "0.74rem", sm: "0.86rem" },
            lineHeight: 1.3,
            whiteSpace: "normal",
            wordBreak: "break-word",
          },
          "& .MuiTableCell-head": {
            fontSize: { xs: "0.76rem", sm: "0.88rem" },
            fontWeight: 700,
          },
        }}
      >
        <Grid container spacing={2.2}>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}><KpiCard title="Total Projects" value={projectPagination.total || projects.length} subtitle="Portfolio visibility" /></Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}><KpiCard title="Open CRs" value={openCrCount} subtitle="Single CR governance" color="#dc2626" /></Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}><KpiCard title="Categories" value={categories.length} subtitle="Structured scope hierarchy" color="#2563eb" /></Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}><KpiCard title="Item Master" value={items.length} subtitle="Model-level control" color="#f97316" /></Grid>
        </Grid>

        <Paper sx={{ mt: 2, p: 1 }}>
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            variant="scrollable"
            allowScrollButtonsMobile
            scrollButtons="auto"
          >
            <Tab label="Projects" sx={{ px: isMobile ? 1.1 : 2 }} />
            <Tab label="Clients" sx={{ px: isMobile ? 1.1 : 2 }} />
            <Tab label="Categories" sx={{ px: isMobile ? 1.1 : 2 }} />
            <Tab label="Product Types" sx={{ px: isMobile ? 1.1 : 2 }} />
            <Tab label="Brands" sx={{ px: isMobile ? 1.1 : 2 }} />
            <Tab label="Models" sx={{ px: isMobile ? 1.1 : 2 }} />
            <Tab label="Users & Roles" sx={{ px: isMobile ? 1.1 : 2 }} />
            <Tab label="Reports" sx={{ px: isMobile ? 1.1 : 2 }} />
            <Tab label="Settings" sx={{ px: isMobile ? 1.1 : 2 }} />
          </Tabs>
        </Paper>

        {notice ? <Alert sx={{ mt: 1.5 }} severity="info">{notice}</Alert> : null}

        {tab === 0 && (
          <Paper sx={{ p: 2, mt: 1.5, overflowX: "auto" }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" useFlexGap>
              <Typography variant="h6">Projects</Typography>
              <Button
                size="small"
                variant="contained"
                onClick={() => setShowCreateProject((v) => !v)}
              >
                {showCreateProject ? "Close" : "Create Project"}
              </Button>
            </Stack>
            <Collapse in={showCreateProject} timeout="auto" unmountOnExit>
              <Paper sx={{ p: 1.2, mt: 1.2, bgcolor: "action.hover" }}>
                <Grid container spacing={1}>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <TextField
                      label="Project Name"
                      size="small"
                      fullWidth
                      value={projectForm.name}
                      onChange={(e) => setProjectForm((p) => ({ ...p, name: e.target.value }))}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <TextField
                      select
                      label="Client Master"
                      size="small"
                      fullWidth
                      value={projectForm.clientId}
                      onChange={(e) => {
                        const selected = clients.find((c) => c.id === e.target.value);
                        setProjectForm((p) => ({
                          ...p,
                          clientId: e.target.value,
                          clientName: selected?.name || p.clientName,
                          location: selected?.location || p.location,
                        }));
                      }}
                    >
                      <MenuItem value="">None</MenuItem>
                      {clients.filter((c) => c.is_active).map((c) => (
                        <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <TextField
                      label="Client Name"
                      size="small"
                      fullWidth
                      value={projectForm.clientName}
                      onChange={(e) => setProjectForm((p) => ({ ...p, clientName: e.target.value }))}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <TextField
                      label="Location"
                      size="small"
                      fullWidth
                      value={projectForm.location}
                      onChange={(e) => setProjectForm((p) => ({ ...p, location: e.target.value }))}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <TextField
                      label="Start Date"
                      type="date"
                      size="small"
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                      value={projectForm.startDate}
                      onChange={(e) => setProjectForm((p) => ({ ...p, startDate: e.target.value }))}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      label="Drive Link (Optional)"
                      size="small"
                      fullWidth
                      value={projectForm.driveLink}
                      onChange={(e) => setProjectForm((p) => ({ ...p, driveLink: e.target.value }))}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Assigned Engineers</InputLabel>
                      <Select
                        multiple
                        label="Assigned Engineers"
                        value={projectForm.engineerIds}
                        onChange={(e) => setProjectForm((p) => ({ ...p, engineerIds: e.target.value }))}
                      >
                        {engineers.map((u) => (
                          <MenuItem key={u.id} value={u.id}>{u.name}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Assigned Client Users</InputLabel>
                      <Select
                        multiple
                        label="Assigned Client Users"
                        value={projectForm.clientUserIds}
                        onChange={(e) => setProjectForm((p) => ({ ...p, clientUserIds: e.target.value }))}
                      >
                        {clientUsers.map((u) => (
                          <MenuItem key={u.id} value={u.id}>{u.name}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={!!projectForm.categorySequenceMode}
                        onChange={(e) =>
                          setProjectForm((p) => ({ ...p, categorySequenceMode: e.target.checked }))
                        }
                      />
                    }
                    label="Category Sequence Mode"
                  />
                  <Button
                    size="small"
                    variant="contained"
                    disabled={
                      creatingProject ||
                      !projectForm.name.trim() ||
                      !projectForm.clientName.trim() ||
                      !projectForm.location.trim() ||
                      !projectForm.startDate
                    }
                    onClick={() => createProjectFromAdmin().catch(() => setNotice("Create project failed"))}
                  >
                    {creatingProject ? "Creating..." : "Create"}
                  </Button>
                </Stack>
              </Paper>
            </Collapse>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
              <Button size="small" disabled={projectPagination.page <= 1} onClick={() => setProjectPage((p) => Math.max(1, p - 1))}>Prev</Button>
              <Typography variant="caption" color="text.secondary">
                Page {projectPagination.page} / {projectPagination.totalPages}
              </Typography>
              <Button size="small" disabled={projectPagination.page >= projectPagination.totalPages} onClick={() => setProjectPage((p) => p + 1)}>Next</Button>
            </Stack>
            <TableContainer className="admin-table-scroll">
            <Table size="small" sx={{ mt: 1 }}>
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
                  <>
                    <TableRow
                      key={p.id}
                      hover
                      sx={{ cursor: "pointer", bgcolor: selectedProjectId === p.id ? "action.selected" : "transparent" }}
                      onClick={() => setSelectedProjectId((prev) => (prev === p.id ? "" : p.id))}
                    >
                      <TableCell>{p.name}</TableCell>
                      <TableCell>{p.client_name}</TableCell>
                      <TableCell>{p.status}</TableCell>
                      <TableCell>{p.has_open_cr ? "Yes" : "No"}</TableCell>
                      <TableCell>{Number(p.visit_count || 0)}</TableCell>
                      <TableCell>{p.last_activity ? new Date(p.last_activity).toLocaleString() : "-"}</TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedProjectId((prev) => (prev === p.id ? "" : p.id));
                          }}
                        >
                          {selectedProjectId === p.id ? "Close" : "Open"}
                        </Button>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell colSpan={7} sx={{ p: 0, borderBottom: selectedProjectId === p.id ? undefined : 0 }}>
                        <Collapse in={selectedProjectId === p.id} timeout="auto" unmountOnExit>
                          <Box sx={{ p: 1.5, bgcolor: "background.default" }}>
                            {projectDetailsLoading ? (
                              <Typography variant="body2" color="text.secondary">Loading project details...</Typography>
                            ) : selectedProjectDashboard?.project?.id === p.id ? (
                              <>
                                <Grid container spacing={1}>
                                  <Grid size={{ xs: 12, md: 3 }}>
                                    <Typography variant="caption" color="text.secondary">Project</Typography>
                                    <Typography variant="body2">{selectedProjectDashboard.project.name}</Typography>
                                  </Grid>
                                  <Grid size={{ xs: 12, md: 3 }}>
                                    <Typography variant="caption" color="text.secondary">Client</Typography>
                                    <Typography variant="body2">{selectedProjectDashboard.project.client_name}</Typography>
                                  </Grid>
                                  <Grid size={{ xs: 12, md: 3 }}>
                                    <Typography variant="caption" color="text.secondary">Location</Typography>
                                    <Typography variant="body2">{selectedProjectDashboard.project.location}</Typography>
                                  </Grid>
                                  <Grid size={{ xs: 12, md: 3 }}>
                                    <Typography variant="caption" color="text.secondary">Status</Typography>
                                    <Typography variant="body2">{selectedProjectDashboard.project.status}</Typography>
                                  </Grid>
                                </Grid>
                                {selectedProjectDashboard.project.drive_link ? (
                                  <Button
                                    sx={{ mt: 1 }}
                                    size="small"
                                    variant="outlined"
                                    onClick={() =>
                                      window.open(
                                        selectedProjectDashboard.project.drive_link,
                                        "_blank",
                                        "noopener,noreferrer"
                                      )
                                    }
                                  >
                                    Open Drive Link
                                  </Button>
                                ) : null}
                                <Stack direction="row" spacing={1} sx={{ mt: 1 }} flexWrap="wrap" useFlexGap>
                                  <Chip label={`BOM Items: ${(selectedProjectDashboard.bom || []).length}`} size="small" />
                                  <Chip label={`Scope: INR ${Number(selectedProjectDashboard.summary?.total_scope_value || 0).toLocaleString()}`} size="small" color="primary" />
                                  <Chip label={`Delivered: INR ${Number(selectedProjectDashboard.summary?.total_delivered_value || 0).toLocaleString()}`} size="small" color="success" />
                                  <Chip label={`Balance: INR ${Number(selectedProjectDashboard.summary?.total_balance_value || 0).toLocaleString()}`} size="small" color="warning" />
                                  <Chip label={`Visits: ${Number(selectedProjectVisitSummary?.totals?.total_visits || selectedProjectDashboard.summary?.visit_count || 0)}`} size="small" color="info" />
                                  <Chip label={`Engineers: ${Number(selectedProjectVisitSummary?.totals?.engineer_count || 0)}`} size="small" />
                                </Stack>
                                <Grid container spacing={1} sx={{ mt: 0.5 }}>
                                  <Grid size={{ xs: 12, md: 6 }}>
                                    <Paper sx={{ p: 1, bgcolor: "action.hover" }}>
                                      <Typography variant="caption" color="text.secondary">Visit By Engineer</Typography>
                                      <Stack spacing={0.4} sx={{ mt: 0.5 }}>
                                        {(selectedProjectVisitSummary?.byEngineer || []).slice(0, 6).map((v) => (
                                          <Typography key={v.engineer_id || v.engineer_name} variant="caption">
                                            {v.engineer_name}: {v.visit_count}
                                          </Typography>
                                        ))}
                                        {!selectedProjectVisitSummary?.byEngineer?.length ? (
                                          <Typography variant="caption" color="text.secondary">No visits logged yet.</Typography>
                                        ) : null}
                                      </Stack>
                                    </Paper>
                                  </Grid>
                                  <Grid size={{ xs: 12, md: 6 }}>
                                    <Paper sx={{ p: 1, bgcolor: "action.hover" }}>
                                      <Typography variant="caption" color="text.secondary">Visit By Month</Typography>
                                      <Stack spacing={0.4} sx={{ mt: 0.5 }}>
                                        {(selectedProjectVisitSummary?.byMonth || []).slice(0, 6).map((v) => (
                                          <Typography key={v.month_key} variant="caption">
                                            {v.month_key}: {v.visit_count}
                                          </Typography>
                                        ))}
                                        {!selectedProjectVisitSummary?.byMonth?.length ? (
                                          <Typography variant="caption" color="text.secondary">No monthly data.</Typography>
                                        ) : null}
                                      </Stack>
                                    </Paper>
                                  </Grid>
                                </Grid>
                                <Stack direction={{ xs: "column", md: "row" }} spacing={1} sx={{ mt: 1 }} alignItems={{ md: "center" }}>
                                  <Button variant="outlined" component="label" size="small">
                                    {selectedProjectUploadFile ? `Selected: ${selectedProjectUploadFile.name}` : "Select File For Drive"}
                                    <input hidden type="file" onChange={(e) => setSelectedProjectUploadFile(e.target.files?.[0] || null)} />
                                  </Button>
                                  <Button
                                    size="small"
                                    variant="contained"
                                    disabled={!selectedProjectUploadFile || selectedProjectUploading}
                                    onClick={() => uploadProjectDriveFile(p.id)}
                                  >
                                    {selectedProjectUploading ? "Uploading..." : "Upload To Google Drive"}
                                  </Button>
                                </Stack>
                                <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
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
                                    Download PDF Report
                                  </Button>
                                </Stack>
                                {selectedProjectDriveFiles.length ? (
                                  <Stack spacing={0.4} sx={{ mt: 1 }}>
                                    <Typography variant="caption" color="text.secondary">Drive Files</Typography>
                                    {selectedProjectDriveFiles.slice(0, 8).map((f) => (
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
                                <Divider sx={{ my: 1 }} />
                                <Typography variant="caption" color="text.secondary">Recent Activity</Typography>
                                <Stack spacing={0.6} sx={{ mt: 0.5 }}>
                                  {selectedProjectActivity.slice(0, 8).map((a) => (
                                    <Typography key={a.id} variant="caption">
                                      {a.action_type} | {new Date(a.created_at).toLocaleString()} {a.user_name ? `| ${a.user_name}` : ""}
                                    </Typography>
                                  ))}
                                  {!selectedProjectActivity.length ? (
                                    <Typography variant="caption" color="text.secondary">No activity found.</Typography>
                                  ) : null}
                                </Stack>
                              </>
                            ) : (
                              <Typography variant="body2" color="text.secondary">Loading project details...</Typography>
                            )}
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </>
                ))}
              </TableBody>
            </Table>
            </TableContainer>
            <Typography variant="caption" color="text.secondary">
              Showing {projects.length} of {projectPagination.total} projects.
            </Typography>
          </Paper>
        )}

        {tab === 1 && (
          <Paper sx={{ p: 2, mt: 1.5 }}>
            <Typography variant="h6">Clients</Typography>
            <Stack direction={{ xs: "column", md: "row" }} spacing={1.2} sx={{ mt: 1 }}>
              <TextField label="Name" value={clientForm.name} onChange={(e) => setClientForm((p) => ({ ...p, name: e.target.value }))} />
              <TextField label="Location" value={clientForm.location} onChange={(e) => setClientForm((p) => ({ ...p, location: e.target.value }))} />
              <TextField label="Primary Contact" value={clientForm.primaryContactName} onChange={(e) => setClientForm((p) => ({ ...p, primaryContactName: e.target.value }))} />
              <TextField label="Phone" value={clientForm.primaryContactPhone} onChange={(e) => setClientForm((p) => ({ ...p, primaryContactPhone: e.target.value }))} />
              <TextField label="Email" value={clientForm.primaryContactEmail} onChange={(e) => setClientForm((p) => ({ ...p, primaryContactEmail: e.target.value }))} />
              <FormControlLabel control={<Switch checked={clientForm.isActive} onChange={(e) => setClientForm((p) => ({ ...p, isActive: e.target.checked }))} />} label="Active" />
              <Button variant="contained" onClick={() => createClient().catch(() => setNotice("Create client failed"))}>Add</Button>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
              <Button size="small" disabled={clientPagination.page <= 1} onClick={() => setClientPage((p) => Math.max(1, p - 1))}>Prev</Button>
              <Typography variant="caption" color="text.secondary">
                Page {clientPagination.page} / {clientPagination.totalPages}
              </Typography>
              <Button size="small" disabled={clientPagination.page >= clientPagination.totalPages} onClick={() => setClientPage((p) => p + 1)}>Next</Button>
            </Stack>
            <TableContainer className="admin-table-scroll" sx={{ mt: 1 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Location</TableCell>
                    <TableCell>Contact</TableCell>
                    <TableCell>Phone</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Projects</TableCell>
                    <TableCell>Active</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {clients.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>
                        <TextField size="small" value={editClient[c.id]?.name ?? c.name} onChange={(e) => setEditClient((p) => ({ ...p, [c.id]: { ...(p[c.id] || {}), name: e.target.value } }))} />
                      </TableCell>
                      <TableCell>
                        <TextField size="small" value={editClient[c.id]?.location ?? c.location ?? ""} onChange={(e) => setEditClient((p) => ({ ...p, [c.id]: { ...(p[c.id] || {}), location: e.target.value } }))} />
                      </TableCell>
                      <TableCell>
                        <TextField size="small" value={editClient[c.id]?.primaryContactName ?? c.primary_contact_name ?? ""} onChange={(e) => setEditClient((p) => ({ ...p, [c.id]: { ...(p[c.id] || {}), primaryContactName: e.target.value } }))} />
                      </TableCell>
                      <TableCell>
                        <TextField size="small" value={editClient[c.id]?.primaryContactPhone ?? c.primary_contact_phone ?? ""} onChange={(e) => setEditClient((p) => ({ ...p, [c.id]: { ...(p[c.id] || {}), primaryContactPhone: e.target.value } }))} />
                      </TableCell>
                      <TableCell>
                        <TextField size="small" value={editClient[c.id]?.primaryContactEmail ?? c.primary_contact_email ?? ""} onChange={(e) => setEditClient((p) => ({ ...p, [c.id]: { ...(p[c.id] || {}), primaryContactEmail: e.target.value } }))} />
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption">{Number(c.project_count || 0)}</Typography>
                        <Typography variant="caption" display="block" color="text.secondary">
                          {(c.associated_projects || []).slice(0, 2).join(", ")}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Switch checked={editClient[c.id]?.isActive ?? !!c.is_active} onChange={(e) => setEditClient((p) => ({ ...p, [c.id]: { ...(p[c.id] || {}), isActive: e.target.checked } }))} />
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          <Button size="small" onClick={() => saveClient(c.id).catch(() => setNotice("Save client failed"))}>Save</Button>
                          <Button size="small" color="error" onClick={() => deleteClient(c.id).catch(() => setNotice("Delete client failed"))}>Delete</Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Typography variant="caption" color="text.secondary">
              Showing {clients.length} of {clientPagination.total} clients.
            </Typography>
          </Paper>
        )}

        {tab === 2 && (
          <Paper sx={{ p: 2, mt: 1.5 }}>
            <Typography variant="h6">Categories</Typography>
            <Stack direction={{ xs: "column", md: "row" }} spacing={1.2} sx={{ mt: 1 }}>
              <TextField label="Category Name" value={catForm.name} onChange={(e) => setCatForm((p) => ({ ...p, name: e.target.value }))} fullWidth />
              <TextField type="number" label="Sequence" value={catForm.sequenceOrder} onChange={(e) => setCatForm((p) => ({ ...p, sequenceOrder: e.target.value }))} />
              <FormControlLabel control={<Switch checked={catForm.isActive} onChange={(e) => setCatForm((p) => ({ ...p, isActive: e.target.checked }))} />} label="Active" />
              <Button variant="contained" onClick={() => createCategory().catch(() => setNotice("Create category failed"))}>Add</Button>
            </Stack>
            <Divider sx={{ my: 1.4 }} />
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Recent Activity Feed</Typography>
            <Stack spacing={0.8}>
              {recentActivity.slice(0, 8).map((r) => (
                <Typography key={r.id} variant="caption" color="text.secondary">
                  {new Date(r.created_at).toLocaleString()} | {r.user_name || "System"} | {r.action_type}
                  {r.project_name ? ` | ${r.project_name}` : ""}
                </Typography>
              ))}
            </Stack>
            <Divider sx={{ my: 1.4 }} />
            <Table size="small">
              <TableHead><TableRow><TableCell>Name</TableCell><TableCell>Sequence</TableCell><TableCell>Active</TableCell><TableCell>Actions</TableCell></TableRow></TableHead>
              <TableBody>
                {categories.slice(0, MAX_RENDER_ROWS).map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <TextField
                        size="small"
                        value={editCategory[c.id]?.name ?? c.name}
                        onChange={(e) =>
                          setEditCategory((prev) => ({
                            ...prev,
                            [c.id]: { ...(prev[c.id] || {}), name: e.target.value },
                          }))
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        type="number"
                        value={editCategory[c.id]?.sequenceOrder ?? c.sequence_order}
                        onChange={(e) =>
                          setEditCategory((prev) => ({
                            ...prev,
                            [c.id]: { ...(prev[c.id] || {}), sequenceOrder: Number(e.target.value || 1) },
                          }))
                        }
                      />
                    </TableCell>
                    <TableCell><Switch checked={!!c.is_active} onChange={() => toggleCategory(c).catch(() => setNotice("Toggle failed"))} /></TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <Button size="small" onClick={() => saveCategory(c.id).catch(() => setNotice("Save failed"))}>Save</Button>
                        <Button size="small" color="error" onClick={() => deleteCategory(c.id).catch(() => setNotice("Delete failed"))}>Delete</Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {categories.length > MAX_RENDER_ROWS ? (
              <Typography variant="caption" color="text.secondary">
                Showing first {MAX_RENDER_ROWS} of {categories.length} categories.
              </Typography>
            ) : null}
          </Paper>
        )}

        {tab === 3 && (
          <Paper sx={{ p: 2, mt: 1.5, overflowX: "auto" }}>
            <Typography variant="h6">Product Types</Typography>
            <Stack direction={{ xs: "column", md: "row" }} spacing={1.2} sx={{ mt: 1 }}>
              <TextField select label="Category" value={ptForm.categoryId} onChange={(e) => setPtForm((p) => ({ ...p, categoryId: e.target.value }))} fullWidth>
                {categories.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
              </TextField>
              <TextField label="Product Type" value={ptForm.name} onChange={(e) => setPtForm((p) => ({ ...p, name: e.target.value }))} fullWidth />
              <FormControlLabel control={<Switch checked={ptForm.isActive} onChange={(e) => setPtForm((p) => ({ ...p, isActive: e.target.checked }))} />} label="Active" />
              <Button variant="contained" onClick={() => createProductType().catch(() => setNotice("Create product type failed"))}>Add</Button>
            </Stack>
            <Divider sx={{ my: 1.4 }} />
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
              <Button size="small" disabled={productTypePage <= 1} onClick={() => setProductTypePage((p) => Math.max(1, p - 1))}>
                Prev
              </Button>
              <Typography variant="caption" color="text.secondary">
                Page {productTypePage} / {productTypeTotalPages}
              </Typography>
              <Button
                size="small"
                disabled={productTypePage >= productTypeTotalPages}
                onClick={() => setProductTypePage((p) => Math.min(productTypeTotalPages, p + 1))}
              >
                Next
              </Button>
            </Stack>
            <TableContainer className="admin-table-scroll">
            <Table size="small">
              <TableHead><TableRow><TableCell>Name</TableCell><TableCell>Category</TableCell><TableCell>Active</TableCell><TableCell>Actions</TableCell></TableRow></TableHead>
              <TableBody>
                {pagedProductTypes.map((pt) => (
                  <TableRow key={pt.id}>
                    <TableCell>
                      {editingProductTypeId === pt.id ? (
                        <TextField
                          size="small"
                          value={editProductType[pt.id]?.name ?? pt.name}
                          onChange={(e) =>
                            setEditProductType((prev) => ({
                              ...prev,
                              [pt.id]: { ...(prev[pt.id] || {}), name: e.target.value },
                            }))
                          }
                        />
                      ) : (
                        pt.name
                      )}
                    </TableCell>
                    <TableCell>
                      {editingProductTypeId === pt.id ? (
                        <TextField
                          select
                          size="small"
                          value={editProductType[pt.id]?.categoryId ?? pt.category_id}
                          onChange={(e) =>
                            setEditProductType((prev) => ({
                              ...prev,
                              [pt.id]: { ...(prev[pt.id] || {}), categoryId: e.target.value },
                            }))
                          }
                        >
                          {categories.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                        </TextField>
                      ) : (
                        categories.find((c) => c.id === pt.category_id)?.name || "-"
                      )}
                    </TableCell>
                    <TableCell><Switch checked={!!pt.is_active} onChange={() => toggleProductType(pt).catch(() => setNotice("Toggle failed"))} /></TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        {editingProductTypeId === pt.id ? (
                          <>
                            <Button size="small" onClick={() => saveProductType(pt.id).catch(() => setNotice("Save failed"))}>Save</Button>
                            <Button size="small" onClick={() => setEditingProductTypeId(null)}>Cancel</Button>
                          </>
                        ) : (
                          <Button size="small" onClick={() => setEditingProductTypeId(pt.id)}>Edit</Button>
                        )}
                        <Button size="small" color="error" onClick={() => deleteProductType(pt.id).catch(() => setNotice("Delete failed"))}>Delete</Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </TableContainer>
            <Typography variant="caption" color="text.secondary">
              Showing {pagedProductTypes.length} of {productTypes.length} product types.
            </Typography>
          </Paper>
        )}

        {tab === 4 && (
          <Paper sx={{ p: 2, mt: 1.5 }}>
            <Typography variant="h6">Brands</Typography>
            <Stack direction={{ xs: "column", md: "row" }} spacing={1.2} sx={{ mt: 1 }}>
              <TextField label="Brand Name" value={brandForm.name} onChange={(e) => setBrandForm((p) => ({ ...p, name: e.target.value }))} fullWidth />
              <FormControlLabel control={<Switch checked={brandForm.isActive} onChange={(e) => setBrandForm((p) => ({ ...p, isActive: e.target.checked }))} />} label="Active" />
              <Button variant="contained" onClick={() => createBrand().catch(() => setNotice("Create brand failed"))}>Add</Button>
            </Stack>
            <Divider sx={{ my: 1.4 }} />
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {brands.map((b) => (
                <Stack key={b.id} direction="row" spacing={1} alignItems="center">
                  <TextField
                    size="small"
                    value={editBrand[b.id]?.name ?? b.name}
                    onChange={(e) =>
                      setEditBrand((prev) => ({
                        ...prev,
                        [b.id]: { ...(prev[b.id] || {}), name: e.target.value },
                      }))
                    }
                  />
                  <Chip label={b.is_active ? "Active" : "Inactive"} color={b.is_active ? "primary" : "default"} onDelete={() => toggleBrand(b).catch(() => setNotice("Toggle failed"))} />
                  <Button size="small" onClick={() => saveBrand(b.id).catch(() => setNotice("Save failed"))}>Save</Button>
                  <Button size="small" color="error" onClick={() => deleteBrand(b.id).catch(() => setNotice("Delete failed"))}>Delete</Button>
                </Stack>
              ))}
            </Stack>
          </Paper>
        )}

        {tab === 5 && (
          <Paper sx={{ p: 2, mt: 1.5, overflowX: "auto" }}>
            <Typography variant="h6">Model Master</Typography>
            <Grid container spacing={1.2} sx={{ mt: 0.5 }}>
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField select label="Category" value={itemForm.categoryId} onChange={(e) => setItemForm((p) => ({ ...p, categoryId: e.target.value, productTypeId: "" }))} fullWidth>
                  {categories.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField select label="Product Type" value={itemForm.productTypeId} onChange={(e) => setItemForm((p) => ({ ...p, productTypeId: e.target.value }))} fullWidth>
                  {filteredPT.map((pt) => <MenuItem key={pt.id} value={pt.id}>{pt.name}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField select label="Brand" value={itemForm.brandId} onChange={(e) => setItemForm((p) => ({ ...p, brandId: e.target.value }))} fullWidth>
                  {brands.map((b) => <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField label="Model Number" value={itemForm.modelNumber} onChange={(e) => setItemForm((p) => ({ ...p, modelNumber: e.target.value }))} fullWidth />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField label="Full Name" value={itemForm.fullName} onChange={(e) => setItemForm((p) => ({ ...p, fullName: e.target.value }))} fullWidth />
              </Grid>
              <Grid size={{ xs: 12, md: 2 }}>
                <TextField label="Unit" value={itemForm.unitOfMeasure} onChange={(e) => setItemForm((p) => ({ ...p, unitOfMeasure: e.target.value }))} fullWidth />
              </Grid>
              <Grid size={{ xs: 12, md: 2 }}>
                <TextField type="number" label="Default Rate" value={itemForm.defaultRate} onChange={(e) => setItemForm((p) => ({ ...p, defaultRate: e.target.value }))} fullWidth />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label="Specifications JSON"
                  value={itemForm.specificationsText}
                  onChange={(e) => setItemForm((p) => ({ ...p, specificationsText: e.target.value }))}
                  fullWidth
                  multiline
                  minRows={2}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 2 }}>
                <FormControlLabel control={<Switch checked={itemForm.isActive} onChange={(e) => setItemForm((p) => ({ ...p, isActive: e.target.checked }))} />} label="Active" />
              </Grid>
              <Grid size={{ xs: 12, md: 2 }}>
                <Button sx={{ mt: 0.8 }} variant="contained" onClick={() => createModel().catch(() => setNotice("Create model failed"))}>Add Model</Button>
              </Grid>
            </Grid>
            <Divider sx={{ my: 1.4 }} />
            <TableContainer className="admin-table-scroll">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Category</TableCell>
                  <TableCell>Product Type</TableCell>
                  <TableCell>Brand</TableCell>
                  <TableCell>Model</TableCell>
                  <TableCell>Rate</TableCell>
                  <TableCell>Active</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.slice(0, 50).map((i) => (
                  <TableRow key={i.id}>
                    <TableCell>{i.category_name}</TableCell>
                    <TableCell>{i.product_type_name}</TableCell>
                    <TableCell>{i.brand_name}</TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        value={editItem[i.id]?.modelNumber ?? i.model_number}
                        onChange={(e) =>
                          setEditItem((prev) => ({
                            ...prev,
                            [i.id]: { ...(prev[i.id] || {}), modelNumber: e.target.value },
                          }))
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        type="number"
                        value={editItem[i.id]?.defaultRate ?? i.default_rate}
                        onChange={(e) =>
                          setEditItem((prev) => ({
                            ...prev,
                            [i.id]: { ...(prev[i.id] || {}), defaultRate: Number(e.target.value || 0) },
                          }))
                        }
                      />
                    </TableCell>
                    <TableCell><Switch checked={!!i.is_active} onChange={() => toggleItem(i).catch(() => setNotice("Toggle failed"))} /></TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <Button size="small" onClick={() => saveItem(i.id).catch(() => setNotice("Save failed"))}>Save</Button>
                        <Button size="small" color="error" onClick={() => deleteItem(i.id).catch(() => setNotice("Delete failed"))}>Delete</Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </TableContainer>
          </Paper>
        )}

        {tab === 6 && (
          <Paper sx={{ p: 2, mt: 1.5, overflowX: "auto" }}>
            <Typography variant="h6">Users & Roles</Typography>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
              <Button size="small" disabled={userPagination.page <= 1} onClick={() => setUserPage((p) => Math.max(1, p - 1))}>Prev</Button>
              <Typography variant="caption" color="text.secondary">
                Page {userPagination.page} / {userPagination.totalPages}
              </Typography>
              <Button size="small" disabled={userPagination.page >= userPagination.totalPages} onClick={() => setUserPage((p) => p + 1)}>Next</Button>
            </Stack>
            <Stack direction={{ xs: "column", md: "row" }} spacing={1.2} sx={{ mt: 1 }}>
              <TextField label="Name" value={userForm.name} onChange={(e) => setUserForm((p) => ({ ...p, name: e.target.value }))} />
              <TextField label="Email" value={userForm.email} onChange={(e) => setUserForm((p) => ({ ...p, email: e.target.value }))} />
              <TextField
                select
                label="Role"
                value={userForm.role}
                onChange={(e) => setUserForm((p) => ({ ...p, role: e.target.value }))}
                sx={{ minWidth: 170 }}
              >
                {["admin", "project_manager", "engineer", "client"].map((r) => (
                  <MenuItem key={r} value={r}>{r}</MenuItem>
                ))}
              </TextField>
              <TextField label="Password" value={userForm.password} onChange={(e) => setUserForm((p) => ({ ...p, password: e.target.value }))} />
              <FormControlLabel control={<Switch checked={userForm.isActive} onChange={(e) => setUserForm((p) => ({ ...p, isActive: e.target.checked }))} />} label="Active" />
              <Button
                variant="contained"
                onClick={async () => {
                  try {
                    await api.post("/admin/users", userForm);
                    setUserForm({ name: "", email: "", role: "engineer", password: "Inka@123", isActive: true });
                    setNotice("User added");
                    await loadAll();
                  } catch {
                    setNotice("Create user failed");
                  }
                }}
              >
                Add User
              </Button>
            </Stack>
            <Divider sx={{ my: 1.4 }} />
            <TableContainer className="admin-table-scroll">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Active</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>{u.name}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>
                      <TextField
                        select
                        size="small"
                        value={u.role}
                        onChange={async (e) => {
                          try {
                            await api.patch(`/admin/users/${u.id}`, { role: e.target.value });
                            await loadAll();
                          } catch {
                            setNotice("Role update failed");
                          }
                        }}
                      >
                        {["admin", "project_manager", "engineer", "client"].map((r) => (
                          <MenuItem key={r} value={r}>{r}</MenuItem>
                        ))}
                      </TextField>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={!!u.is_active}
                        onChange={async () => {
                          try {
                            await api.patch(`/admin/users/${u.id}`, { isActive: !u.is_active });
                            await loadAll();
                          } catch {
                            setNotice("Status update failed");
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Button size="small" color="error" onClick={() => deleteUser(u.id).catch(() => setNotice("Delete user failed"))}>Delete</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </TableContainer>
            <Typography variant="caption" color="text.secondary">
              Showing {users.length} of {userPagination.total} users.
            </Typography>
          </Paper>
        )}

        {tab === 7 && (
          <Paper sx={{ p: 2, mt: 1.5 }}>
            <Typography variant="h6">Reports</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Use Project Manager or Client screens to download project PDF reports. Admin report hub is enabled here for parity.
            </Typography>
          </Paper>
        )}

        {tab === 8 && (
          <Paper sx={{ p: 2, mt: 1.5, overflowX: "auto" }}>
            <Typography variant="h6">Settings</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 1.2 }}>
              Governance defaults are enforced through role policies and project-level category sequence mode.
            </Typography>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Role Policy Matrix</Typography>
            <TableContainer className="admin-table-scroll">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Capability</TableCell>
                  <TableCell>Admin</TableCell>
                  <TableCell>Project Manager</TableCell>
                  <TableCell>Engineer</TableCell>
                  <TableCell>Client</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {[
                  ["Client Master CRUD", "Yes", "Yes", "No", "No"],
                  ["Master Data CRUD", "Yes", "No", "No", "No"],
                  ["Create / Update Project", "Yes", "Yes", "No", "No"],
                  ["Create / Edit CR", "Yes", "Yes", "No", "No"],
                  ["Approve / Reject CR", "Yes", "Yes", "No", "No"],
                  ["Log Delivery", "Yes", "Yes", "Yes", "No"],
                  ["Update Work Status", "Yes", "Yes", "Yes", "No"],
                  ["View Activity Feed", "Yes", "Yes", "Yes", "Yes (filtered)"],
                  ["Download Project PDF", "Yes", "Yes", "Yes", "Yes"],
                ].map((row) => (
                  <TableRow key={row[0]}>
                    <TableCell>{row[0]}</TableCell>
                    <TableCell>{row[1]}</TableCell>
                    <TableCell>{row[2]}</TableCell>
                    <TableCell>{row[3]}</TableCell>
                    <TableCell>{row[4]}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </TableContainer>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" sx={{ mb: 1 }}>Excel Import</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Import projects, clients, and master data from an Excel file. The file should have &quot;ClientProjects List&quot; sheet with project names, and individual project sheets with Brand/Product/Model columns.
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
                onClick={() => importExcel().catch(() => setNotice("Import failed"))}
              >
                {excelImporting ? "Importing..." : "Import Excel"}
              </Button>
            </Stack>
            {excelImportResult && (
              <Paper sx={{ p: 1.5, mt: 1, bgcolor: "action.hover" }}>
                <Typography variant="subtitle2">Import Results:</Typography>
                <Typography variant="caption" display="block">
                  Projects: {excelImportResult.projectsImported} | Clients: {excelImportResult.clientsCreated} | 
                  Categories: {excelImportResult.categoriesCreated} | Brands: {excelImportResult.brandsCreated} | 
                  Product Types: {excelImportResult.productTypesCreated} | Items: {excelImportResult.itemsCreated} | 
                  BOM Items: {excelImportResult.bomItemsCreated}
                </Typography>
                {excelImportResult.errors?.length > 0 && (
                  <Typography variant="caption" color="error" display="block" sx={{ mt: 0.5 }}>
                    Errors: {excelImportResult.errors.length}
                  </Typography>
                )}
              </Paper>
            )}
          </Paper>
        )}
      </Box>
    </Fade>
  );
}
