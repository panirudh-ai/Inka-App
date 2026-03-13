import { useEffect, useMemo, useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  Grid2 as Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
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
  Zoom,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import AddIcon from "@mui/icons-material/Add";
import CompareArrowsIcon from "@mui/icons-material/CompareArrows";
import HierarchySelector from "../components/HierarchySelector";
import KpiCard from "../components/KpiCard";
import { api } from "../api/client";

export default function AdminView() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const PAGE_SIZE = 25;
  const MAX_RENDER_ROWS = 200;
  const [tab, setTab] = useState(0);
  const [catSearch, setCatSearch] = useState("");
  const [ptSearch, setPtSearch] = useState("");
  const [brandSearch, setBrandSearch] = useState("");
  const [modelSearch, setModelSearch] = useState("");
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

  // Admin inner dashboard tabs
  const [adminInnerTab, setAdminInnerTab] = useState(0);
  const [adminCrs, setAdminCrs] = useState([]);
  const [adminDeliveries, setAdminDeliveries] = useState([]);
  const [adminVisits, setAdminVisits] = useState([]);
  const [adminCrDiff, setAdminCrDiff] = useState({ diff: [], summary: { totalDeltaQty: 0 } });
  const [adminVisitNotes, setAdminVisitNotes] = useState("");
  // BOM add dialog
  const [adminOpenAdd, setAdminOpenAdd] = useState(false);
  const [adminSelector, setAdminSelector] = useState({ categoryId: "", productTypeId: "", brandId: "", itemId: "" });
  const [adminQty, setAdminQty] = useState(1);
  const [adminRate, setAdminRate] = useState(0);
  const [adminFloorLabel, setAdminFloorLabel] = useState("Unassigned");
  const [adminLocationDescription, setAdminLocationDescription] = useState("");
  // CR item add
  const [adminCrSelector, setAdminCrSelector] = useState({ categoryId: "", productTypeId: "", brandId: "", itemId: "" });
  const [adminCrChangeType, setAdminCrChangeType] = useState("add");
  const [adminCrQty, setAdminCrQty] = useState(1);
  const [adminCrFloorLabel, setAdminCrFloorLabel] = useState("Unassigned");
  const [adminCrLocationDescription, setAdminCrLocationDescription] = useState("");
  // Delivery
  const [adminDeliverySelector, setAdminDeliverySelector] = useState({ categoryId: "", productTypeId: "", brandId: "", itemId: "" });
  const [adminDeliveryQty, setAdminDeliveryQty] = useState(1);
  const [adminDeliveryNotes, setAdminDeliveryNotes] = useState("");
  const [adminDeliveryPhotoFile, setAdminDeliveryPhotoFile] = useState(null);
  const [adminToast, setAdminToast] = useState({ open: false, severity: "success", text: "" });
  const [adminProjectContacts, setAdminProjectContacts] = useState([]);

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
  const [editProjectOpen, setEditProjectOpen] = useState(false);
  const [editProjectId, setEditProjectId] = useState("");
  const [editProjectForm, setEditProjectForm] = useState({ name: "", clientId: "", clientName: "", location: "", driveLink: "", startDate: "", engineerIds: [], clientUserIds: [], categorySequenceMode: false });
  const [deleteProjectOpen, setDeleteProjectOpen] = useState(false);
  const [deleteProjectId, setDeleteProjectId] = useState("");
  const [viewMode, setViewMode] = useState("list");
  const [statusFilter, setStatusFilter] = useState("");
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
      api.get("/projects", { params: { paginated: true, page: projectPage, limit: PAGE_SIZE, ...(statusFilter ? { status: statusFilter } : {}) } }),
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
    setProjects((Array.isArray(p.data) ? p.data : p.data.data || []).reverse());
    setProjectPagination(
      Array.isArray(p.data)
        ? { page: 1, totalPages: 1, total: p.data.length }
        : p.data.pagination || { page: 1, totalPages: 1, total: 0 }
    );
    setCategories([...c.data].reverse());
    setProductTypes([...pt.data].reverse());
    setBrands([...b.data].reverse());
    setItems([...i.data].reverse());
    setUsers((Array.isArray(u.data) ? u.data : u.data.data || []).reverse());
    setUserPagination(
      Array.isArray(u.data)
        ? { page: 1, totalPages: 1, total: u.data.length }
        : u.data.pagination || { page: 1, totalPages: 1, total: 0 }
    );
    setRecentActivity(a.data);
    setClients((Array.isArray(cl.data) ? cl.data : cl.data.data || []).reverse());
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
      const [dashboardRes, activityRes, visitSummaryRes, crRes, deliveryRes, visitsRes] = await Promise.all([
        api.get(`/projects/${projectId}/dashboard`),
        api.get(`/projects/${projectId}/activity`),
        api.get(`/projects/${projectId}/visits/summary`).catch(() => ({
          data: { totals: {}, byEngineer: [], byMonth: [] },
        })),
        api.get(`/projects/${projectId}/change-requests`).catch(() => ({ data: [] })),
        api.get(`/projects/${projectId}/deliveries`).catch(() => ({ data: [] })),
        api.get(`/projects/${projectId}/visits`, { params: { paginated: true, page: 1, limit: 20 } }).catch(() => ({ data: { data: [] } })),
      ]);
      setSelectedProjectDashboard(dashboardRes.data);
      setSelectedProjectActivity(activityRes.data || []);
      setSelectedProjectVisitSummary(visitSummaryRes.data || { totals: {}, byEngineer: [], byMonth: [] });
      setAdminCrs(crRes.data || []);
      setAdminDeliveries(deliveryRes.data || []);
      setAdminVisits(Array.isArray(visitsRes.data) ? visitsRes.data : visitsRes.data.data || []);
      setAdminProjectContacts(dashboardRes.data?.contacts || []);
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
  }, [projectPage, userPage, clientPage, statusFilter]);

  useEffect(() => {
    function onPop() { setViewMode("list"); }
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  function openProjectDashboard(pid) {
    setSelectedProjectId(pid);
    setTab(0);
    setViewMode("dashboard");
    window.history.pushState({ projectId: pid }, "", `/project/${pid}/dashboard`);
  }

  function goBackToList() {
    setViewMode("list");
    window.history.back();
  }

  useEffect(() => {
    if (!selectedProjectId) return;
    setSelectedProjectUploadFile(null);
    loadProjectDetails(selectedProjectId).catch(() => setNotice("Failed to load selected project details"));
  }, [selectedProjectId]);

  const openCrCount = useMemo(() => projects.filter((p) => p.has_open_cr).length, [projects]);

  const adminOpenCr = useMemo(() => adminCrs.find((c) => c.status === "draft" || c.status === "pending"), [adminCrs]);
  const adminGrouped = useMemo(() => {
    const map = new Map();
    for (const row of selectedProjectDashboard?.bom || []) {
      const floor = row.floor_label || "Unassigned";
      if (!map.has(floor)) map.set(floor, []);
      map.get(floor).push(row);
    }
    return Array.from(map.entries());
  }, [selectedProjectDashboard]);
  const adminSelectedDeliveryBom = useMemo(
    () => (selectedProjectDashboard?.bom || []).find((b) => b.item_id === adminDeliverySelector.itemId),
    [selectedProjectDashboard?.bom, adminDeliverySelector.itemId]
  );
  const adminSelectedModel = useMemo(() => items.find((i) => i.id === adminSelector.itemId), [items, adminSelector.itemId]);

  useEffect(() => {
    if (adminSelectedModel) setAdminRate(Number(adminSelectedModel.default_rate || 0));
  }, [adminSelectedModel]);

  useEffect(() => {
    if (!adminOpenCr?.id) {
      setAdminCrDiff({ diff: [], summary: { totalDeltaQty: 0 } });
      return;
    }
    api.get(`/change-requests/${adminOpenCr.id}/diff`)
      .then((res) => setAdminCrDiff(res.data))
      .catch(() => setAdminCrDiff({ diff: [], summary: { totalDeltaQty: 0 } }));
  }, [adminOpenCr?.id, selectedProjectDashboard?.bom?.length]);

  const filteredPT = productTypes.filter((x) => x.category_id === itemForm.categoryId);
  const productTypePageSize = 50;
  const productTypeTotalPages = Math.max(1, Math.ceil(productTypes.length / productTypePageSize));
  const pagedProductTypes = useMemo(() => {
    const start = (productTypePage - 1) * productTypePageSize;
    return productTypes.slice(start, start + productTypePageSize);
  }, [productTypes, productTypePage]);

  const filteredCategories = useMemo(() => {
    if (!catSearch) return categories;
    const q = catSearch.toLowerCase();
    return categories.filter((c) => c.name.toLowerCase().includes(q));
  }, [categories, catSearch]);

  const filteredProductTypes = useMemo(() => {
    if (!ptSearch) return null; // null = use pagination
    const q = ptSearch.toLowerCase();
    return productTypes.filter(
      (pt) =>
        pt.name.toLowerCase().includes(q) ||
        (categories.find((c) => c.id === pt.category_id)?.name || "").toLowerCase().includes(q)
    );
  }, [productTypes, categories, ptSearch]);

  const filteredBrands = useMemo(() => {
    if (!brandSearch) return brands;
    const q = brandSearch.toLowerCase();
    return brands.filter((b) => b.name.toLowerCase().includes(q));
  }, [brands, brandSearch]);

  const filteredModels = useMemo(() => {
    if (!modelSearch) return items;
    const q = modelSearch.toLowerCase();
    return items.filter(
      (i) =>
        (i.model_number || "").toLowerCase().includes(q) ||
        (i.brand_name || "").toLowerCase().includes(q) ||
        (i.product_type_name || "").toLowerCase().includes(q) ||
        (i.category_name || "").toLowerCase().includes(q) ||
        (i.full_name || "").toLowerCase().includes(q)
    );
  }, [items, modelSearch]);

  async function adminCreateCr() {
    if (!selectedProjectId) return;
    await api.post(`/projects/${selectedProjectId}/change-requests`);
    setAdminToast({ open: true, severity: "success", text: "Change request created" });
    await loadProjectDetails(selectedProjectId);
  }
  async function adminAddCrItem() {
    if (!adminOpenCr?.id || !adminCrSelector.itemId) return;
    const current = selectedProjectDashboard?.bom?.find((x) => x.item_id === adminCrSelector.itemId);
    await api.post(`/change-requests/${adminOpenCr.id}/items`, {
      itemId: adminCrSelector.itemId,
      changeType: adminCrChangeType,
      oldQuantity: current ? Number(current.quantity) : null,
      newQuantity: adminCrChangeType === "delete" ? null : Number(adminCrQty),
      floorLabel: adminCrFloorLabel || "Unassigned",
      locationDescription: adminCrLocationDescription || "",
    });
    setAdminToast({ open: true, severity: "success", text: "CR delta added" });
    await loadProjectDetails(selectedProjectId);
  }
  async function adminSubmitCr() {
    if (!adminOpenCr?.id) return;
    await api.post(`/change-requests/${adminOpenCr.id}/submit`);
    setAdminToast({ open: true, severity: "success", text: "CR submitted" });
    await loadProjectDetails(selectedProjectId);
  }
  async function adminApproveCr() {
    if (!adminOpenCr?.id) return;
    await api.post(`/change-requests/${adminOpenCr.id}/approve`);
    setAdminToast({ open: true, severity: "success", text: "CR approved" });
    await loadProjectDetails(selectedProjectId);
  }
  async function adminRejectCr() {
    if (!adminOpenCr?.id) return;
    await api.post(`/change-requests/${adminOpenCr.id}/reject`);
    setAdminToast({ open: true, severity: "success", text: "CR rejected" });
    await loadProjectDetails(selectedProjectId);
  }
  async function adminAddBomItem() {
    if (!adminOpenCr?.id || !adminSelector.itemId) return;
    await api.post(`/change-requests/${adminOpenCr.id}/items`, {
      itemId: adminSelector.itemId,
      changeType: "add",
      oldQuantity: null,
      newQuantity: Number(adminQty),
      floorLabel: adminFloorLabel || "Unassigned",
      locationDescription: adminLocationDescription || "",
    });
    setAdminOpenAdd(false);
    setAdminSelector({ categoryId: "", productTypeId: "", brandId: "", itemId: "" });
    setAdminQty(1);
    setAdminRate(0);
    setAdminFloorLabel("Unassigned");
    setAdminLocationDescription("");
    setAdminToast({ open: true, severity: "success", text: "Added to CR diff" });
    await loadProjectDetails(selectedProjectId);
  }
  async function adminLogDelivery() {
    const itemId = adminDeliverySelector.itemId;
    if (!selectedProjectId || !itemId) return;
    let photoUrl;
    if (adminDeliveryPhotoFile) {
      const fd = new FormData();
      fd.append("photo", adminDeliveryPhotoFile);
      const uploaded = await api.post("/uploads/photo", fd, { headers: { "Content-Type": "multipart/form-data" } });
      photoUrl = uploaded.data.photoUrl;
    }
    await api.post(`/projects/${selectedProjectId}/deliveries`, {
      itemId,
      quantity: Number(adminDeliveryQty),
      notes: adminDeliveryNotes,
      photoUrl,
    });
    setAdminToast({ open: true, severity: "success", text: "Delivery logged" });
    setAdminDeliverySelector({ categoryId: "", productTypeId: "", brandId: "", itemId: "" });
    setAdminDeliveryQty(1);
    setAdminDeliveryNotes("");
    setAdminDeliveryPhotoFile(null);
    await loadProjectDetails(selectedProjectId);
  }
  async function adminLogVisit() {
    if (!selectedProjectId) return;
    await api.post(`/projects/${selectedProjectId}/visits`, { notes: adminVisitNotes || "" });
    setAdminVisitNotes("");
    setAdminToast({ open: true, severity: "success", text: "Site visit logged" });
    await loadProjectDetails(selectedProjectId);
  }
  async function adminSaveContacts() {
    if (!selectedProjectId) return;
    await api.put(`/projects/${selectedProjectId}/contacts`, {
      contacts: adminProjectContacts.map((c) => ({
        roleName: c.roleName || c.role_name || "",
        contactName: c.contactName || c.contact_name || "",
        phone: c.phone || "",
        email: c.email || "",
        notes: c.notes || "",
      })),
    });
    setAdminToast({ open: true, severity: "success", text: "Contacts updated" });
  }

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

  async function saveAdminEditProject() {
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
    setNotice("Project updated");
    await loadAll();
  }

  async function confirmAdminDeleteProject() {
    if (!deleteProjectId) return;
    await api.delete(`/projects/${deleteProjectId}`);
    setDeleteProjectOpen(false);
    setDeleteProjectId("");
    setNotice("Project deleted");
    if (selectedProjectId === deleteProjectId) setSelectedProjectId("");
    await loadAll();
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

        {viewMode === "list" && (
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
        )}

        {notice ? <Alert sx={{ mt: 1.5 }} severity="info">{notice}</Alert> : null}

        {tab === 0 && (
          <>
          {viewMode === "dashboard" && (
            <Button variant="outlined" sx={{ mb: 2, mt: 1.5 }} onClick={goBackToList}>
              ← Back to Projects
            </Button>
          )}
          {viewMode === "list" && (<Paper sx={{ p: 2, mt: 1.5, overflowX: "auto" }}>
            <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} flexWrap="wrap" useFlexGap spacing={1}>
              <Typography variant="h6">Projects</Typography>
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
                <Button
                  size="small"
                  variant="contained"
                  onClick={() => setShowCreateProject((v) => !v)}
                >
                  {showCreateProject ? "Close" : "Create Project"}
                </Button>
              </Stack>
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
                      label="Client"
                      size="small"
                      fullWidth
                      value={projectForm.clientId}
                      onChange={(e) => {
                        const selected = clients.find((c) => c.id === e.target.value);
                        setProjectForm((p) => ({
                          ...p,
                          clientId: e.target.value,
                          clientName: selected?.name || "",
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
                      slotProps={{ inputLabel: { shrink: true } }}
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
                          <Stack direction="row" spacing={0.5}>
                            <Button
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedProjectId((prev) => (prev === p.id ? "" : p.id));
                              }}
                            >
                              {selectedProjectId === p.id ? "Close" : "Open"}
                            </Button>
                            <Button
                              size="small"
                              color="primary"
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
                            >
                              Edit
                            </Button>
                            <Button
                              size="small"
                              color="error"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteProjectId(p.id);
                                setDeleteProjectOpen(true);
                              }}
                            >
                              Delete
                            </Button>
                          </Stack>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell colSpan={7} sx={{ p: 0, borderBottom: selectedProjectId === p.id ? undefined : 0 }}>
                          <Collapse in={selectedProjectId === p.id} timeout="auto" unmountOnExit>
                            <Box id={`admin-dashboard-${p.id}`} sx={{ p: 1.5, bgcolor: "background.default" }}>
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
                                      <Select
                                        size="small"
                                        value={selectedProjectDashboard.project.status}
                                        onChange={async (e) => {
                                          await api.patch(`/projects/${selectedProjectId}`, { status: e.target.value });
                                          setAdminToast({ open: true, severity: "success", text: "Status updated" });
                                          await loadProjectDetails(selectedProjectId);
                                          await loadAll();
                                        }}
                                        sx={{ display: "block", mt: 0.3 }}
                                      >
                                        <MenuItem value="active">Active</MenuItem>
                                        <MenuItem value="on_hold">On Hold</MenuItem>
                                        <MenuItem value="completed">Completed</MenuItem>
                                      </Select>
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
                                  <Divider sx={{ my: 1 }} />
                                  <Button
                                    size="small"
                                    variant="contained"
                                    onClick={() => openProjectDashboard(p.id)}
                                  >
                                    Open In Dashboard
                                  </Button>
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

          {viewMode === "dashboard" && selectedProjectId && selectedProjectDashboard?.project?.id === selectedProjectId && (
            <Paper id="admin-project-dashboard" sx={{ p: 2.2, mt: 2 }}>
              {/* Header — project selector + download report (mirrors PM) */}
              <Stack direction={{ xs: "column", md: "row" }} spacing={1.2} alignItems={{ md: "center" }} justifyContent="space-between">
                <Typography variant="h6">Project Dashboard</Typography>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ sm: "center" }}>
                  <FormControl size="small" sx={{ minWidth: { sm: 260 }, width: { xs: "100%", sm: "auto" } }}>
                    <InputLabel>Project</InputLabel>
                    <Select label="Project" value={selectedProjectId} onChange={(e) => setSelectedProjectId(e.target.value)}>
                      {projects.map((p) => (
                        <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Button
                    variant="outlined"
                    sx={{ width: { xs: "100%", sm: "auto" } }}
                    disabled={!selectedProjectId}
                    onClick={async () => {
                      const res = await api.get(`/projects/${selectedProjectId}/report.pdf`, { responseType: "blob" });
                      const url = URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `inka_report_${selectedProjectId}.pdf`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                  >
                    Download Report
                  </Button>
                </Stack>
              </Stack>

              {/* Summary chips — same order as PM */}
              <Stack direction="row" spacing={1} sx={{ mt: 1.2 }} flexWrap="wrap" useFlexGap>
                <Chip label={`Open CR: ${adminOpenCr ? "Yes" : "No"}`} color={adminOpenCr ? "warning" : "success"} />
                <Chip label={`Total BOM Value: INR ${Number(selectedProjectDashboard.summary?.total_scope_value || 0).toLocaleString()}`} color="primary" variant="outlined" />
                <Chip label={`Delivered Value: INR ${Number(selectedProjectDashboard.summary?.total_delivered_value || 0).toLocaleString()}`} color="warning" variant="outlined" />
                <Chip label={`Balance: INR ${Number(selectedProjectDashboard.summary?.total_balance_value || 0).toLocaleString()}`} color="secondary" variant="outlined" />
                <Chip label={`Visits: ${Number(selectedProjectDashboard.summary?.visit_count || 0)}`} color="info" variant="outlined" />
              </Stack>

              {projectDetailsLoading ? (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Loading project details...</Typography>
              ) : (
                <Paper sx={{ mt: 1.4, p: 1.4, bgcolor: "background.paper" }}>
                  {/* Project info grid */}
                  <Grid container spacing={1}>
                    <Grid size={{ xs: 12, md: 3 }}><Typography variant="caption" color="text.secondary">Project</Typography><Typography variant="body2">{selectedProjectDashboard.project.name}</Typography></Grid>
                    <Grid size={{ xs: 12, md: 3 }}><Typography variant="caption" color="text.secondary">Client</Typography><Typography variant="body2">{selectedProjectDashboard.project.client_name}</Typography></Grid>
                    <Grid size={{ xs: 12, md: 3 }}><Typography variant="caption" color="text.secondary">Location</Typography><Typography variant="body2">{selectedProjectDashboard.project.location}</Typography></Grid>
                    <Grid size={{ xs: 12, md: 3 }}>
                      <Typography variant="caption" color="text.secondary">Status</Typography>
                      <Select
                        size="small"
                        value={selectedProjectDashboard.project.status}
                        onChange={async (e) => {
                          await api.patch(`/projects/${selectedProjectId}`, { status: e.target.value });
                          setAdminToast({ open: true, severity: "success", text: "Status updated" });
                          await loadProjectDetails(selectedProjectId);
                          await loadAll();
                        }}
                        sx={{ display: "block", mt: 0.3 }}
                      >
                        <MenuItem value="active">Active</MenuItem>
                        <MenuItem value="on_hold">On Hold</MenuItem>
                        <MenuItem value="completed">Completed</MenuItem>
                      </Select>
                    </Grid>
                  </Grid>

                  {selectedProjectDashboard.project.drive_link && (
                    <Button sx={{ mt: 1 }} size="small" variant="outlined" onClick={() => window.open(selectedProjectDashboard.project.drive_link, "_blank", "noopener,noreferrer")}>
                      Open Drive Link
                    </Button>
                  )}

                  {/* Drive upload */}
                  <Stack direction={{ xs: "column", md: "row" }} spacing={1} sx={{ mt: 1 }} alignItems={{ md: "center" }}>
                    <Button variant="outlined" component="label" size="small">
                      {selectedProjectUploadFile ? `Selected: ${selectedProjectUploadFile.name}` : "Select File For Drive"}
                      <input hidden type="file" onChange={(e) => setSelectedProjectUploadFile(e.target.files?.[0] || null)} />
                    </Button>
                    <Button size="small" variant="contained" disabled={!selectedProjectUploadFile || selectedProjectUploading} onClick={() => uploadProjectDriveFile(selectedProjectId)}>
                      {selectedProjectUploading ? "Uploading..." : "Upload To Google Drive"}
                    </Button>
                  </Stack>

                  {/* Drive files */}
                  {selectedProjectDriveFiles.length > 0 && (
                    <Stack spacing={0.5} sx={{ mt: 1 }}>
                      <Typography variant="caption" color="text.secondary">Drive Files</Typography>
                      {selectedProjectDriveFiles.slice(0, 8).map((f) => (
                        <Button key={f.id} size="small" variant="text" sx={{ justifyContent: "flex-start" }} onClick={() => window.open(f.webViewLink || f.webContentLink, "_blank", "noopener,noreferrer")}>
                          {f.name}
                        </Button>
                      ))}
                    </Stack>
                  )}


                  {/* Project Contacts */}
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="caption" color="text.secondary">Project Contacts</Typography>
                  <Stack spacing={0.8} sx={{ mt: 0.8 }}>
                    {adminProjectContacts.map((c, idx) => (
                      <Stack key={`contact-${idx}`} direction={{ xs: "column", md: "row" }} spacing={1}>
                        <TextField size="small" label="Role" value={c.roleName || c.role_name || ""} onChange={(e) => setAdminProjectContacts((prev) => prev.map((x, i) => i === idx ? { ...x, roleName: e.target.value } : x))} />
                        <TextField size="small" label="Name" value={c.contactName || c.contact_name || ""} onChange={(e) => setAdminProjectContacts((prev) => prev.map((x, i) => i === idx ? { ...x, contactName: e.target.value } : x))} />
                        <TextField size="small" label="Phone" value={c.phone || ""} onChange={(e) => setAdminProjectContacts((prev) => prev.map((x, i) => i === idx ? { ...x, phone: e.target.value } : x))} />
                        <TextField size="small" label="Email" value={c.email || ""} onChange={(e) => setAdminProjectContacts((prev) => prev.map((x, i) => i === idx ? { ...x, email: e.target.value } : x))} />
                        <Button color="error" onClick={() => setAdminProjectContacts((prev) => prev.filter((_, i) => i !== idx))}>Remove</Button>
                      </Stack>
                    ))}
                    <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
                      <Button size="small" variant="outlined" onClick={() => setAdminProjectContacts((prev) => [...prev, { roleName: "Civil Engineer", contactName: "", phone: "", email: "", notes: "" }])}>Add Contact</Button>
                      <Button size="small" variant="contained" onClick={() => adminSaveContacts().catch(() => setAdminToast({ open: true, severity: "error", text: "Save contacts failed" }))}>Save Contacts</Button>
                    </Stack>
                  </Stack>

                  {/* Log Site Visit */}
                  <Divider sx={{ my: 1 }} />
                  <TextField
                    label="Visit Notes"
                    value={adminVisitNotes}
                    onChange={(e) => setAdminVisitNotes(e.target.value)}
                    fullWidth
                    multiline
                    minRows={3}
                    sx={{ mb: 1 }}
                  />
                  <Button variant="contained" onClick={() => adminLogVisit().catch(() => setAdminToast({ open: true, severity: "error", text: "Log visit failed" }))}>Log Site Visit</Button>
                  <Stack spacing={0.4} sx={{ mt: 1 }}>
                    {adminVisits.slice(0, 5).map((v) => (
                      <Typography key={v.id} variant="caption" color="text.secondary">
                        {new Date(v.created_at).toLocaleString()} | {v.engineer_name || "Engineer"} | {v.notes || "-"}
                      </Typography>
                    ))}
                  </Stack>

                  {/* Visit Analytics */}
                  <Divider sx={{ my: 1.5 }} />
                  <Typography variant="subtitle2" sx={{ mb: 0.8 }}>Visit Analytics</Typography>
                  <Stack direction="row" spacing={1} sx={{ mb: 1 }} flexWrap="wrap" useFlexGap>
                    <Chip label={`Total Visits: ${Number(selectedProjectVisitSummary?.totals?.total_visits || 0)}`} color="primary" variant="outlined" size="small" />
                    <Chip label={`Engineers: ${Number(selectedProjectVisitSummary?.totals?.engineer_count || 0)}`} color="info" variant="outlined" size="small" />
                    <Chip label={`First Visit: ${selectedProjectVisitSummary?.totals?.first_visit_date || "-"}`} variant="outlined" size="small" />
                    <Chip label={`Last Visit: ${selectedProjectVisitSummary?.totals?.last_visit_date || "-"}`} variant="outlined" size="small" />
                  </Stack>
                  <Grid container spacing={1.5} sx={{ mb: 1 }}>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Paper sx={{ p: 1.2, bgcolor: "action.hover" }}>
                        <Typography variant="caption" color="text.secondary">Engineer-wise Visits</Typography>
                        <Table size="small" sx={{ mt: 0.5 }}>
                          <TableHead><TableRow><TableCell>Engineer</TableCell><TableCell align="right">Visits</TableCell></TableRow></TableHead>
                          <TableBody>
                            {(selectedProjectVisitSummary?.byEngineer || []).map((r) => (
                              <TableRow key={r.engineer_id || r.engineer_name}>
                                <TableCell>{r.engineer_name}</TableCell>
                                <TableCell align="right">{r.visit_count}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </Paper>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Paper sx={{ p: 1.2, bgcolor: "action.hover" }}>
                        <Typography variant="caption" color="text.secondary">Month-wise Visits</Typography>
                        <Table size="small" sx={{ mt: 0.5 }}>
                          <TableHead><TableRow><TableCell>Month</TableCell><TableCell align="right">Visits</TableCell></TableRow></TableHead>
                          <TableBody>
                            {(selectedProjectVisitSummary?.byMonth || []).map((r) => (
                              <TableRow key={r.month_key}>
                                <TableCell>{r.month_key}</TableCell>
                                <TableCell align="right">{r.visit_count}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </Paper>
                    </Grid>
                  </Grid>

                  {/* Activity Feed */}
                  <Divider sx={{ my: 1.5 }} />
                  <Typography variant="subtitle2" sx={{ mb: 0.8 }}>Activity Feed</Typography>
                  <Stack spacing={0.6}>
                    {selectedProjectActivity.slice(0, 10).map((a) => (
                      <Paper key={a.id} sx={{ p: 1.1, bgcolor: "action.hover" }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{a.action_type}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(a.created_at).toLocaleString()} {a.user_name ? `| ${a.user_name}` : ""}
                        </Typography>
                      </Paper>
                    ))}
                    {!selectedProjectActivity.length && <Typography variant="body2" color="text.secondary">No activity yet.</Typography>}
                  </Stack>
                </Paper>
              )}
            </Paper>
          )}

          {viewMode === "dashboard" && selectedProjectId && selectedProjectDashboard?.project?.id === selectedProjectId && (
            <>
            <Paper sx={{ p: 1, mt: 2 }}>
              <Tabs value={adminInnerTab} onChange={(_, v) => setAdminInnerTab(v)} variant="scrollable" allowScrollButtonsMobile scrollButtons="auto">
                <Tab label="BOM" />
                <Tab label="Change Requests" />
                <Tab label="Deliveries" />
              </Tabs>
            </Paper>

            {projectDetailsLoading && <CircularProgress sx={{ mt: 2 }} />}

            {adminInnerTab === 0 && (
              <Zoom in timeout={350}>
                <Box sx={{ mt: 2 }}>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1} justifyContent="space-between" sx={{ mb: 1.5 }}>
                    <Typography variant="h6">Structured BOM</Typography>
                    <Button startIcon={<AddIcon />} variant="contained" disabled={!adminOpenCr} onClick={() => setAdminOpenAdd(true)}>
                      Add Item via CR
                    </Button>
                  </Stack>
                  {adminGrouped.map(([floor, rows]) => (
                    <Accordion key={floor} sx={{ mb: 1 }} defaultExpanded>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography sx={{ fontWeight: 600 }}>Floor: {floor}</Typography>
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
                                <Stack direction="row" spacing={1}>
                                  <Chip label={`Approved ${r.quantity}`} size="small" color="primary" />
                                  <Chip label={`Delivered ${r.delivered_quantity}`} size="small" color="success" />
                                  <Chip label={`Balance ${Number(r.quantity) - Number(r.delivered_quantity)}`} size="small" color="warning" />
                                </Stack>
                              </Paper>
                            </Grid>
                          ))}
                        </Grid>
                      </AccordionDetails>
                    </Accordion>
                  ))}
                  {!adminGrouped.length && <Typography variant="body2" color="text.secondary">No BOM items yet.</Typography>}
                </Box>
              </Zoom>
            )}

            {adminInnerTab === 1 && (
              <Paper sx={{ mt: 2, p: 2 }}>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1} justifyContent="space-between" alignItems={{ sm: "center" }} sx={{ mb: 1.5 }}>
                  <Typography variant="h6">Single Change Request Governance</Typography>
                  {!adminOpenCr ? (
                    <Button variant="contained" startIcon={<CompareArrowsIcon />} onClick={() => adminCreateCr().catch(() => setAdminToast({ open: true, severity: "error", text: "Create CR failed" }))} disabled={!selectedProjectId}>
                      Create Change Request
                    </Button>
                  ) : (
                    <Chip label={`CR ${adminOpenCr.id.slice(0, 8)} | ${adminOpenCr.status.toUpperCase()}`} color="warning" />
                  )}
                </Stack>

                {adminOpenCr && adminOpenCr.status !== "pending" && (
                  <Stack spacing={1.5}>
                    <HierarchySelector
                      categories={categories}
                      productTypes={productTypes}
                      brands={brands}
                      items={items}
                      value={adminCrSelector}
                      onChange={(change) => setAdminCrSelector((prev) => ({ ...prev, ...change }))}
                    />
                    <Stack direction={{ xs: "column", md: "row" }} spacing={1.2}>
                      <FormControl fullWidth>
                        <InputLabel>Change Type</InputLabel>
                        <Select value={adminCrChangeType} label="Change Type" onChange={(e) => setAdminCrChangeType(e.target.value)}>
                          <MenuItem value="add">Add</MenuItem>
                          <MenuItem value="modify">Modify Quantity</MenuItem>
                          <MenuItem value="delete">Delete</MenuItem>
                        </Select>
                      </FormControl>
                      <TextField type="number" label="New Quantity" value={adminCrQty} onChange={(e) => setAdminCrQty(Number(e.target.value || 0))} disabled={adminCrChangeType === "delete"} fullWidth />
                      <TextField label="Floor" value={adminCrFloorLabel} onChange={(e) => setAdminCrFloorLabel(e.target.value)} fullWidth />
                      <TextField label="Location Description" value={adminCrLocationDescription} onChange={(e) => setAdminCrLocationDescription(e.target.value)} fullWidth />
                      <Button variant="contained" onClick={() => adminAddCrItem().catch(() => setAdminToast({ open: true, severity: "error", text: "Add CR item failed" }))}>Add Delta</Button>
                      <Button variant="outlined" onClick={() => adminSubmitCr().catch(() => setAdminToast({ open: true, severity: "error", text: "Submit CR failed" }))}>Submit CR</Button>
                    </Stack>
                  </Stack>
                )}

                {adminOpenCr && adminOpenCr.status === "pending" && (
                  <Stack direction="row" spacing={1.2} sx={{ mt: 1.2 }}>
                    <Button variant="contained" color="success" onClick={() => adminApproveCr().catch(() => setAdminToast({ open: true, severity: "error", text: "Approve failed" }))}>Approve CR</Button>
                    <Button variant="outlined" color="error" onClick={() => adminRejectCr().catch(() => setAdminToast({ open: true, severity: "error", text: "Reject failed" }))}>Reject CR</Button>
                  </Stack>
                )}

                <Grid container spacing={2} sx={{ mt: 0.5 }}>
                  <Grid size={{ xs: 12, md: 7 }}>
                    <Typography variant="body2">CR changes are delta-based and applied only on approval.</Typography>
                  </Grid>
                  <Grid size={{ xs: 12, md: 5 }}>
                    <Paper sx={{ p: 1.5, bgcolor: "action.hover" }}>
                      <Typography variant="subtitle2">Live Diff Panel</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Total Scope Qty Delta: {adminCrDiff.summary?.totalDeltaQty ?? 0}
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
                          {(adminCrDiff.diff || []).map((d) => (
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

            {adminInnerTab === 2 && (
              <Paper sx={{ mt: 2, p: 2 }}>
                <Typography variant="h6">Site Deliveries</Typography>
                <Grid container spacing={1.2} sx={{ mt: 1.2 }}>
                  <Grid size={{ xs: 12 }}>
                    <HierarchySelector
                      categories={categories}
                      productTypes={productTypes}
                      brands={brands}
                      items={items.filter((x) => (selectedProjectDashboard?.bom || []).some((b) => b.item_id === x.id))}
                      value={adminDeliverySelector}
                      onChange={(change) => setAdminDeliverySelector((prev) => ({ ...prev, ...change }))}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 2 }}>
                    <TextField type="number" label="Delivered Qty" value={adminDeliveryQty} onChange={(e) => setAdminDeliveryQty(Number(e.target.value || 0))} fullWidth />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField label="Notes" value={adminDeliveryNotes} onChange={(e) => setAdminDeliveryNotes(e.target.value)} fullWidth />
                  </Grid>
                  <Grid size={{ xs: 6, md: 2 }}>
                    <Button fullWidth variant="outlined" component="label">
                      {adminDeliveryPhotoFile ? "Photo Selected" : "Upload Photo"}
                      <input hidden type="file" accept="image/*" onChange={(e) => setAdminDeliveryPhotoFile(e.target.files?.[0] || null)} />
                    </Button>
                  </Grid>
                  <Grid size={{ xs: 6, md: 2 }}>
                    <Button fullWidth variant="contained" onClick={() => adminLogDelivery().catch(() => setAdminToast({ open: true, severity: "error", text: "Log delivery failed" }))}>Log</Button>
                  </Grid>
                </Grid>
                {adminSelectedDeliveryBom && (
                  <Stack direction="row" spacing={1} sx={{ mt: 1.2 }}>
                    <Chip label={`Approved ${adminSelectedDeliveryBom.quantity}`} size="small" />
                    <Chip label={`Previously Delivered ${adminSelectedDeliveryBom.delivered_quantity}`} size="small" color="success" />
                    <Chip label={`Balance ${Number(adminSelectedDeliveryBom.quantity) - Number(adminSelectedDeliveryBom.delivered_quantity)}`} size="small" color="warning" />
                  </Stack>
                )}
                <Stack spacing={1} sx={{ mt: 2 }}>
                  {adminDeliveries.slice(0, 8).map((d) => (
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
                  {!adminDeliveries.length && <Typography variant="body2" color="text.secondary">No deliveries logged yet.</Typography>}
                </Stack>
              </Paper>
            )}


            {/* Add BOM Item Dialog */}
            <Dialog open={adminOpenAdd} onClose={() => setAdminOpenAdd(false)} fullWidth maxWidth="md">
              <DialogTitle>Add BOM Item</DialogTitle>
              <DialogContent>
                <HierarchySelector
                  categories={categories}
                  productTypes={productTypes}
                  brands={brands}
                  items={items}
                  value={adminSelector}
                  onChange={(change) => setAdminSelector((prev) => ({ ...prev, ...change }))}
                />
                <Grid container spacing={1.2} sx={{ mt: 0.6 }}>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField type="number" label="Quantity" fullWidth value={adminQty} onChange={(e) => setAdminQty(Number(e.target.value || 0))} />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField type="number" label="Rate" fullWidth value={adminRate} onChange={(e) => setAdminRate(Number(e.target.value || 0))} />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField label="Unit" fullWidth value={adminSelectedModel?.unit_of_measure || "-"} disabled />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField label="Floor (GF / FF / etc)" fullWidth value={adminFloorLabel} onChange={(e) => setAdminFloorLabel(e.target.value)} />
                  </Grid>
                  <Grid size={{ xs: 12, md: 8 }}>
                    <TextField label="Location Description" fullWidth value={adminLocationDescription} onChange={(e) => setAdminLocationDescription(e.target.value)} />
                  </Grid>
                </Grid>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setAdminOpenAdd(false)}>Cancel</Button>
                <Button variant="contained" onClick={() => adminAddBomItem().catch(() => setAdminToast({ open: true, severity: "error", text: "Add BOM item failed" }))}>Save</Button>
              </DialogActions>
            </Dialog>

            <Snackbar open={adminToast.open} autoHideDuration={2500} onClose={() => setAdminToast((p) => ({ ...p, open: false }))}>
              <Alert severity={adminToast.severity}>{adminToast.text}</Alert>
            </Snackbar>
            </>
          )}
          </>
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
            <TextField
              size="small"
              label="Search categories"
              value={catSearch}
              onChange={(e) => setCatSearch(e.target.value)}
              sx={{ mb: 1.2, maxWidth: 320 }}
            />
            <Table size="small">
              <TableHead><TableRow><TableCell>Name</TableCell><TableCell>Sequence</TableCell><TableCell>Active</TableCell><TableCell>Actions</TableCell></TableRow></TableHead>
              <TableBody>
                {filteredCategories.slice(0, MAX_RENDER_ROWS).map((c) => (
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
            <Typography variant="caption" color="text.secondary">
              Showing {Math.min(filteredCategories.length, MAX_RENDER_ROWS)} of {filteredCategories.length} categories{catSearch ? ` matching "${catSearch}"` : ""}.
            </Typography>
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
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }} flexWrap="wrap" useFlexGap>
              <TextField
                size="small"
                label="Search product types"
                value={ptSearch}
                onChange={(e) => { setPtSearch(e.target.value); setProductTypePage(1); }}
                sx={{ maxWidth: 320 }}
              />
              {!ptSearch && (
                <>
                  <Button size="small" disabled={productTypePage <= 1} onClick={() => setProductTypePage((p) => Math.max(1, p - 1))}>Prev</Button>
                  <Typography variant="caption" color="text.secondary">Page {productTypePage} / {productTypeTotalPages}</Typography>
                  <Button size="small" disabled={productTypePage >= productTypeTotalPages} onClick={() => setProductTypePage((p) => Math.min(productTypeTotalPages, p + 1))}>Next</Button>
                </>
              )}
            </Stack>
            <TableContainer className="admin-table-scroll">
              <Table size="small">
                <TableHead><TableRow><TableCell>Name</TableCell><TableCell>Category</TableCell><TableCell>Active</TableCell><TableCell>Actions</TableCell></TableRow></TableHead>
                <TableBody>
                  {(filteredProductTypes || pagedProductTypes).map((pt) => (
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
              Showing {(filteredProductTypes || pagedProductTypes).length} of {productTypes.length} product types{ptSearch ? ` matching "${ptSearch}"` : ""}.
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
            <TextField
              size="small"
              label="Search brands"
              value={brandSearch}
              onChange={(e) => setBrandSearch(e.target.value)}
              sx={{ mb: 1.2, maxWidth: 320 }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
              Showing {filteredBrands.length} of {brands.length} brands{brandSearch ? ` matching "${brandSearch}"` : ""}.
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {filteredBrands.map((b) => (
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
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.2 }} flexWrap="wrap" useFlexGap>
              <TextField
                size="small"
                label="Search models (name, brand, type, category)"
                value={modelSearch}
                onChange={(e) => setModelSearch(e.target.value)}
                sx={{ minWidth: 320 }}
              />
              <Typography variant="caption" color="text.secondary">
                Showing {Math.min(filteredModels.length, 100)} of {filteredModels.length} models{modelSearch ? ` matching "${modelSearch}"` : ""}.
              </Typography>
            </Stack>
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
                  {filteredModels.slice(0, 100).map((i) => (
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
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2 }}>
              Select a project to download its PDF report.
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ sm: "center" }}>
              <FormControl size="small" sx={{ minWidth: 280 }}>
                <InputLabel>Project</InputLabel>
                <Select
                  label="Project"
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                >
                  {projects.map((p) => (
                    <MenuItem key={p.id} value={p.id}>{p.name} — {p.client_name || "No client"}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button
                variant="contained"
                disabled={!selectedProjectId}
                onClick={async () => {
                  if (!selectedProjectId) return;
                  const res = await api.get(`/projects/${selectedProjectId}/report.pdf`, { responseType: "blob" });
                  const url = URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `inka_report_${selectedProjectId}.pdf`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                Download PDF Report
              </Button>
            </Stack>
            {projects.length > 0 && (
              <TableContainer className="admin-table-scroll" sx={{ mt: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Project</TableCell>
                      <TableCell>Client</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Visits</TableCell>
                      <TableCell>Download</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {projects.map((p) => (
                      <TableRow key={p.id} hover>
                        <TableCell>{p.name}</TableCell>
                        <TableCell>{p.client_name || "-"}</TableCell>
                        <TableCell><Chip label={p.status} size="small" /></TableCell>
                        <TableCell>{Number(p.visit_count || 0)}</TableCell>
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
            )}
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
              Showing {projects.length} of {projectPagination.total} projects on current page.
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

      <Dialog open={editProjectOpen} onClose={() => setEditProjectOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>Edit Project</DialogTitle>
        <DialogContent>
          <Grid container spacing={1.2} sx={{ mt: 0.2 }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField label="Project Name" size="small" fullWidth value={editProjectForm.name} onChange={(e) => setEditProjectForm((p) => ({ ...p, name: e.target.value }))} />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Client</InputLabel>
                <Select
                  label="Client"
                  value={editProjectForm.clientId}
                  onChange={(e) => {
                    const selected = clients.find((c) => c.id === e.target.value);
                    setEditProjectForm((p) => ({
                      ...p,
                      clientId: e.target.value,
                      clientName: selected?.name || "",
                      location: selected?.location || p.location,
                    }));
                  }}
                >
                  <MenuItem value="">None</MenuItem>
                  {clients.filter((c) => c.is_active).map((c) => (
                    <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField label="Location" size="small" fullWidth value={editProjectForm.location} onChange={(e) => setEditProjectForm((p) => ({ ...p, location: e.target.value }))} />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField label="Drive Link (Optional)" size="small" fullWidth value={editProjectForm.driveLink} onChange={(e) => setEditProjectForm((p) => ({ ...p, driveLink: e.target.value }))} />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField label="Start Date" type="date" size="small" fullWidth slotProps={{ inputLabel: { shrink: true } }} value={editProjectForm.startDate} onChange={(e) => setEditProjectForm((p) => ({ ...p, startDate: e.target.value }))} />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Assigned Engineers</InputLabel>
                <Select multiple label="Assigned Engineers" value={editProjectForm.engineerIds} onChange={(e) => setEditProjectForm((p) => ({ ...p, engineerIds: e.target.value }))}>
                  {engineers.map((u) => (
                    <MenuItem key={u.id} value={u.id}>{u.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <FormControl fullWidth size="small">
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
          <Button onClick={() => setEditProjectOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => saveAdminEditProject().catch(() => setNotice("Update project failed"))}>Save</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteProjectOpen} onClose={() => setDeleteProjectOpen(false)} maxWidth="xs">
        <DialogTitle>Delete Project</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this project? This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteProjectOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={() => confirmAdminDeleteProject().catch(() => setNotice("Delete project failed"))}>Delete</Button>
        </DialogActions>
      </Dialog>

      </Box>
    </Fade>
  );
}
