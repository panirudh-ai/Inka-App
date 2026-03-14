import { Fragment, useEffect, useMemo, useState } from "react";
import {
  Accordion,
  AccordionItem,
  Button,
  Chip,
  Divider,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Select,
  SelectItem,
  Spinner,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Tabs,
  Textarea,
} from "@heroui/react";
import HierarchySelector from "../components/HierarchySelector";
import { api } from "../api/client";
import KpiCard from "../components/KpiCard";

/* ─── tiny helper ──────────────────────────────────────────────── */
function showToastFn(setToast, severity, text) {
  setToast({ open: true, severity, text });
  setTimeout(() => setToast((p) => ({ ...p, open: false })), 2500);
}

/* ─── inline Select (native MUI-style wrapper for complex cases) ─ */
function NativeSelect({ label, value, onChange, children, disabled, className }) {
  return (
    <div className={className}>
      {label && <label className="inka-label">{label}</label>}
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="w-full h-9 px-3 text-sm rounded-md border border-[#E3E8EF] dark:border-[#1E3A5F] bg-white dark:bg-[#0D1B2E]/50 text-[#1A1F36] dark:text-[#C9D7E8] focus:border-[#635BFF] focus:ring-2 focus:ring-[#635BFF]/15 outline-none transition-colors"
      >
        {children}
      </select>
    </div>
  );
}

export default function ProjectManagerView({ masterData, role = "project_manager" }) {
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState([]);
  const [openProjectRowId, setOpenProjectRowId] = useState("");
  const [engineers, setEngineers] = useState([]);
  const [clients, setClients] = useState([]);
  const [clientMasters, setClientMasters] = useState([]);
  const [clientMasterForm, setClientMasterForm] = useState({
    name: "", location: "", primaryContactName: "", primaryContactPhone: "",
    primaryContactEmail: "", notes: "", isActive: true,
  });
  const [editClientMaster, setEditClientMaster] = useState({});
  const [projectId, setProjectId] = useState("");
  const [openCreateProject, setOpenCreateProject] = useState(false);
  const [newProject, setNewProject] = useState({
    name: "", clientId: "", clientName: "", location: "", driveLink: "",
    startDate: "", engineerIds: [], clientUserIds: [], categorySequenceMode: false,
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
  const PAGE_SIZE = 25;
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
      const floor = row.floor_label || "Unassigned";
      if (!map.has(floor)) map.set(floor, []);
      map.get(floor).push(row);
    }
    return Array.from(map.entries());
  }, [dashboard]);

  const selectedModel = useMemo(() => masterData.items.find((i) => i.id === selector.itemId), [masterData.items, selector.itemId]);
  const selectedDeliveryItemId = deliverySelector.itemId || deliveryItemId;
  const selectedDeliveryBom = useMemo(() => (dashboard?.bom || []).find((b) => b.item_id === selectedDeliveryItemId), [dashboard?.bom, selectedDeliveryItemId]);

  function showToast(severity, text) { showToastFn(setToast, severity, text); }

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
    const [engRes, clientRes] = await Promise.all([api.get("/reference/users?role=engineer"), api.get("/reference/users?role=client")]);
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
      const visitsRes = await api.get(`/projects/${pid}/visits`, { params: { paginated: true, page: 1, limit: 20 } }).catch(() => ({ data: { data: [] } }));
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

  useEffect(() => { fetchEngineers().catch(() => {}); }, []);
  useEffect(() => { fetchProjects().catch(() => {}); }, [projectPage, statusFilter]);
  useEffect(() => { fetchClientMasters().catch(() => {}); }, [clientPage]);
  useEffect(() => { loadProject(projectId).catch(() => {}); }, [projectId]);
  useEffect(() => { if (selectedModel) setRate(Number(selectedModel.default_rate || 0)); }, [selectedModel]);

  useEffect(() => {
    const match = window.location.pathname.match(/\/project\/([^/]+)\/dashboard/);
    if (match) { setProjectId(match[1]); setOuterTab(0); setViewMode("dashboard"); }
  }, []);

  useEffect(() => {
    function onPop() { setViewMode("list"); }
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  function openProjectDashboard(pid) {
    setProjectId(pid); setOuterTab(0); setViewMode("dashboard");
    window.history.pushState({ projectId: pid }, "", `/project/${pid}/dashboard`);
  }

  function goBackToList() { setViewMode("list"); window.history.back(); }

  async function addBomItem() {
    if (!openCr?.id || !selector.itemId) return;
    await api.post(`/change-requests/${openCr.id}/items`, { itemId: selector.itemId, changeType: "add", oldQuantity: null, newQuantity: Number(qty), floorLabel: floorLabel || "Unassigned", locationDescription: locationDescription || "" });
    setOpenAdd(false);
    setSelector({ categoryId: "", productTypeId: "", brandId: "", itemId: "" });
    setQty(1); setRate(0); setFloorLabel("Unassigned"); setLocationDescription("");
    showToast("success", "Added to CR diff");
    await loadProject(projectId);
  }

  async function createCr() {
    if (!projectId) return;
    await api.post(`/projects/${projectId}/change-requests`);
    showToast("success", "Change request created");
    await loadProject(projectId);
  }

  async function addCrItem() {
    if (!openCr?.id || !crSelector.itemId) return;
    const current = dashboard?.bom?.find((x) => x.item_id === crSelector.itemId);
    const payload = { itemId: crSelector.itemId, changeType: crChangeType, oldQuantity: current ? Number(current.quantity) : null, newQuantity: crChangeType === "delete" ? null : Number(crQty), floorLabel: crFloorLabel || "Unassigned", locationDescription: crLocationDescription || "" };
    await api.post(`/change-requests/${openCr.id}/items`, payload);
    showToast("success", "CR delta added");
    await loadProject(projectId);
  }

  useEffect(() => {
    if (!openCr?.id) { setCrDiff({ diff: [], summary: { totalDeltaQty: 0 } }); return; }
    api.get(`/change-requests/${openCr.id}/diff`).then((res) => setCrDiff(res.data)).catch(() => setCrDiff({ diff: [], summary: { totalDeltaQty: 0 } }));
  }, [openCr?.id, dashboard?.bom?.length]);

  async function submitCr() { if (!openCr?.id) return; await api.post(`/change-requests/${openCr.id}/submit`); showToast("success", "CR submitted"); await loadProject(projectId); }
  async function approveCr() { if (!openCr?.id) return; await api.post(`/change-requests/${openCr.id}/approve`); showToast("success", "CR approved"); await loadProject(projectId); }
  async function rejectCr() { if (!openCr?.id) return; await api.post(`/change-requests/${openCr.id}/reject`); showToast("success", "CR rejected"); await loadProject(projectId); }

  async function logDelivery() {
    const itemId = deliverySelector.itemId || deliveryItemId;
    if (!projectId || !itemId) return;
    let photoUrl;
    if (deliveryPhotoFile) {
      const fd = new FormData(); fd.append("photo", deliveryPhotoFile);
      const uploaded = await api.post("/uploads/photo", fd, { headers: { "Content-Type": "multipart/form-data" } });
      photoUrl = uploaded.data.photoUrl;
    }
    await api.post(`/projects/${projectId}/deliveries`, { itemId, quantity: Number(deliveryQty), notes: deliveryNotes, photoUrl });
    showToast("success", "Delivery logged");
    setDeliveryItemId(""); setDeliverySelector({ categoryId: "", productTypeId: "", brandId: "", itemId: "" });
    setDeliveryQty(1); setDeliveryNotes(""); setDeliveryPhotoFile(null);
    await loadProject(projectId);
  }

  async function createProject() {
    await api.post("/projects", { ...newProject, clientId: newProject.clientId || undefined, engineerIds: newProject.engineerIds, clientUserIds: newProject.clientUserIds, categorySequenceMode: !!newProject.categorySequenceMode });
    setOpenCreateProject(false);
    setNewProject({ name: "", clientId: "", clientName: "", location: "", driveLink: "", startDate: "", engineerIds: [], clientUserIds: [], categorySequenceMode: false });
    showToast("success", "Project created");
    await fetchProjects();
  }

  async function saveEditProject() {
    if (!editProjectId) return;
    await api.patch(`/projects/${editProjectId}`, { name: editProjectForm.name || undefined, clientId: editProjectForm.clientId || undefined, clientName: editProjectForm.clientName || undefined, location: editProjectForm.location || undefined, driveLink: editProjectForm.driveLink || null, startDate: editProjectForm.startDate || null, engineerIds: editProjectForm.engineerIds, clientUserIds: editProjectForm.clientUserIds, categorySequenceMode: !!editProjectForm.categorySequenceMode });
    setEditProjectOpen(false);
    showToast("success", "Project updated");
    await fetchProjects();
  }

  async function confirmDeleteProject() {
    if (!deleteProjectId) return;
    await api.delete(`/projects/${deleteProjectId}`);
    setDeleteProjectOpen(false); setDeleteProjectId("");
    showToast("success", "Project deleted");
    if (projectId === deleteProjectId) setProjectId("");
    await fetchProjects();
  }

  async function uploadDriveFile() {
    if (!projectId || !driveUploadFile) return;
    setDriveUploading(true);
    try {
      const fd = new FormData(); fd.append("file", driveUploadFile); fd.append("projectId", projectId);
      await api.post("/uploads/drive", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setDriveUploadFile(null);
      showToast("success", "File uploaded to Google Drive");
      await loadProject(projectId);
    } catch (e) {
      showToast("error", e?.response?.data?.error || "Drive upload failed");
    } finally {
      setDriveUploading(false);
    }
  }

  async function saveContacts() {
    if (!projectId) return;
    await api.put(`/projects/${projectId}/contacts`, { contacts: projectContacts.map((c) => ({ roleName: c.roleName || c.role_name || "", contactName: c.contactName || c.contact_name || "", phone: c.phone || "", email: c.email || "", notes: c.notes || "" })) });
    showToast("success", "Contacts updated");
    await loadProject(projectId);
  }

  async function logVisit() {
    if (!projectId) return;
    await api.post(`/projects/${projectId}/visits`, { notes: visitNotes || "" });
    setVisitNotes("");
    showToast("success", "Site visit logged");
    await loadProject(projectId);
  }

  async function createClientMaster() {
    await api.post("/clients", clientMasterForm);
    setClientMasterForm({ name: "", location: "", primaryContactName: "", primaryContactPhone: "", primaryContactEmail: "", notes: "", isActive: true });
    showToast("success", "Client created");
    await fetchClientMasters();
  }

  async function saveClientMaster(clientId) {
    await api.patch(`/clients/${clientId}`, editClientMaster[clientId] || {});
    setEditClientMaster((prev) => ({ ...prev, [clientId]: undefined }));
    showToast("success", "Client updated");
    await fetchClientMasters();
  }

  async function deleteClientMaster(clientId) {
    await api.delete(`/clients/${clientId}`);
    showToast("success", "Client deleted");
    await fetchClientMasters();
  }

  async function importExcel() {
    if (!excelImportFile) return;
    setExcelImporting(true); setExcelImportResult(null);
    try {
      const fd = new FormData(); fd.append("file", excelImportFile);
      const res = await api.post("/uploads/excel-import", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setExcelImportResult(res.data);
      showToast("success", `Excel imported: ${res.data.projectsImported} projects, ${res.data.itemsCreated} items created`);
      setExcelImportFile(null);
      await fetchProjects(); await fetchClientMasters();
    } catch (e) {
      showToast("error", e?.response?.data?.error || "Excel import failed");
    } finally {
      setExcelImporting(false);
    }
  }

  /* ── shared input class ── */
  const inputCls = { inputWrapper: "border-[#E3E8EF] dark:border-[#1E3A5F] bg-white dark:bg-[#0D1B2E]/50 rounded-md" };
  const toastBg = toast.severity === "error" ? "bg-[#DF1B41]" : toast.severity === "warning" ? "bg-[#B7791F]" : "bg-[#1A9E5D]";

  return (
    <div className="space-y-4">
      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard title="Total Projects" value={projectPagination.total || projects.length} subtitle="Portfolio visibility" />
        <KpiCard title="Open CRs" value={openCrCount} subtitle="Pending approvals" color="#dc2626" />
        <KpiCard title="Categories" value={masterData.categories.length} subtitle="Structured scope hierarchy" color="#2563eb" />
        <KpiCard title="Item Master" value={masterData.items.length} subtitle="Model-level control" color="#f97316" />
      </div>

      {/* Outer tab bar (list mode only) */}
      {viewMode === "list" && (
        <div className="bg-white dark:bg-[#0F2240] border border-[#E3E8EF] dark:border-[#1E3A5F] rounded-xl shadow-sm px-3 pt-1">
          <Tabs selectedKey={String(outerTab)} onSelectionChange={(k) => setOuterTab(Number(k))} variant="underlined"
            classNames={{ tabList: "w-full border-b-0", tab: "text-sm font-medium", cursor: "bg-[#635BFF]" }}>
            <Tab key="0" title="Projects" />
            <Tab key="1" title="Clients" />
            <Tab key="2" title="Reports" />
          </Tabs>
        </div>
      )}

      {/* ── Projects Tab ────────────────────────────────────── */}
      {viewMode === "list" && outerTab === 0 && (
        <div className="bg-white dark:bg-[#0F2240] border border-[#E3E8EF] dark:border-[#1E3A5F] rounded-xl shadow-sm p-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
            <h2 className="text-base font-bold text-[#0A2540] dark:text-[#C9D7E8]">Project List</h2>
            <div className="flex flex-wrap gap-2 items-center">
              <NativeSelect value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setProjectPage(1); }} className="w-32">
                <option value="">All</option>
                <option value="active">Active</option>
                <option value="on_hold">On Hold</option>
                <option value="completed">Completed</option>
              </NativeSelect>
              <Button color="primary" size="sm" onPress={() => setOpenCreateProject(true)}>Create Project</Button>
            </div>
          </div>
          {/* Pagination */}
          <div className="flex items-center gap-2 mb-3">
            <Button size="sm" variant="flat" isDisabled={projectPagination.page <= 1} onPress={() => setProjectPage((p) => Math.max(1, p - 1))}>Prev</Button>
            <span className="text-xs text-[#697386] dark:text-[#7B93AE]">Page {projectPagination.page} / {projectPagination.totalPages}</span>
            <Button size="sm" variant="flat" isDisabled={projectPagination.page >= projectPagination.totalPages} onPress={() => setProjectPage((p) => p + 1)}>Next</Button>
            <span className="text-xs text-[#697386] dark:text-[#7B93AE]">({projectPagination.total} total)</span>
          </div>
          {/* Table */}
          <div className="overflow-x-auto">
            <Table aria-label="Projects" classNames={{ th: "text-[#697386] font-semibold text-xs uppercase tracking-wide bg-[#F6F9FC] dark:bg-[#162B47] py-2.5", td: "py-2.5 text-sm" }}>
              <TableHeader>
                <TableColumn>Project</TableColumn>
                <TableColumn>Client</TableColumn>
                <TableColumn>Status</TableColumn>
                <TableColumn>Open CR</TableColumn>
                <TableColumn>Visits</TableColumn>
                <TableColumn>Last Activity</TableColumn>
                <TableColumn>Actions</TableColumn>
              </TableHeader>
              <TableBody>
                {projects.map((p) => (
                  <Fragment key={p.id}>
                    <TableRow
                      className={`cursor-pointer hover:bg-[#F0F4F9] dark:hover:bg-[#162B47] transition-colors ${projectId === p.id ? "bg-[#EEF2FF] dark:bg-[#635BFF]/10" : ""}`}
                      onClick={() => { setProjectId(p.id); setOpenProjectRowId((prev) => (prev === p.id ? "" : p.id)); }}
                    >
                      <TableCell className="font-medium text-[#1A1F36] dark:text-[#C9D7E8]">{p.name}</TableCell>
                      <TableCell className="text-[#697386] dark:text-[#7B93AE]">{p.client_name}</TableCell>
                      <TableCell><Chip size="sm" variant="flat" color={p.status === "active" ? "success" : p.status === "completed" ? "primary" : "warning"} classNames={{ base: "h-5", content: "text-xs px-1" }}>{p.status}</Chip></TableCell>
                      <TableCell><Chip size="sm" variant="flat" color={p.has_open_cr ? "warning" : "success"} classNames={{ base: "h-5", content: "text-xs px-1" }}>{p.has_open_cr ? "Yes" : "No"}</Chip></TableCell>
                      <TableCell>{Number(p.visit_count || 0)}</TableCell>
                      <TableCell className="text-[#697386] dark:text-[#7B93AE]">{p.last_activity ? new Date(p.last_activity).toLocaleString() : "-"}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="sm" variant="flat" className="h-7 text-xs min-w-0 px-2"
                            onPress={(e) => { setProjectId(p.id); setOpenProjectRowId((prev) => (prev === p.id ? "" : p.id)); }}>
                            {openProjectRowId === p.id ? "Close" : "Open"}
                          </Button>
                          <Button size="sm" color="primary" variant="flat" className="h-7 text-xs min-w-0 px-2"
                            onPress={() => { setEditProjectId(p.id); setEditProjectForm({ name: p.name || "", clientId: p.client_id || "", clientName: p.client_name || "", location: p.location || "", driveLink: p.drive_link || "", startDate: p.start_date ? p.start_date.slice(0, 10) : "", engineerIds: p.engineer_ids || [], clientUserIds: p.client_user_ids || [], categorySequenceMode: !!p.category_sequence_mode }); setEditProjectOpen(true); }}>
                            Edit
                          </Button>
                          <Button size="sm" color="danger" variant="flat" className="h-7 text-xs min-w-0 px-2"
                            onPress={() => { setDeleteProjectId(p.id); setDeleteProjectOpen(true); }}>
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    {openProjectRowId === p.id && (
                      <TableRow className="bg-[#F6F9FC] dark:bg-[#162B47]">
                        <TableCell colSpan={7}>
                          <div className="p-3">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                              {[["Project", p.name], ["Client", p.client_name], ["Location", dashboard?.project?.id === p.id ? dashboard.project.location : p.location], ["Status", p.status]].map(([l, v]) => (
                                <div key={l}><p className="text-xs text-[#697386] dark:text-[#7B93AE]">{l}</p><p className="text-sm text-[#1A1F36] dark:text-[#C9D7E8]">{v}</p></div>
                              ))}
                            </div>
                            <div className="flex flex-wrap gap-2 mb-3">
                              <Chip size="sm" variant="flat" color="primary" classNames={{ base: "h-5", content: "text-xs px-1" }}>Visits: {Number(p.visit_count || 0)}</Chip>
                              <Chip size="sm" variant="flat" color={p.has_open_cr ? "warning" : "success"} classNames={{ base: "h-5", content: "text-xs px-1" }}>Open CR: {p.has_open_cr ? "Yes" : "No"}</Chip>
                              {dashboard?.project?.id === p.id && (<>
                                <Chip size="sm" variant="flat" color="primary" classNames={{ base: "h-5", content: "text-xs px-1" }}>Scope: INR {Number(dashboard.summary?.total_scope_value || 0).toLocaleString()}</Chip>
                                <Chip size="sm" variant="flat" color="success" classNames={{ base: "h-5", content: "text-xs px-1" }}>Delivered: INR {Number(dashboard.summary?.total_delivered_value || 0).toLocaleString()}</Chip>
                                <Chip size="sm" variant="flat" color="warning" classNames={{ base: "h-5", content: "text-xs px-1" }}>Balance: INR {Number(dashboard.summary?.total_balance_value || 0).toLocaleString()}</Chip>
                              </>)}
                            </div>
                            <Button size="sm" variant="bordered" className="border-[#635BFF] text-[#635BFF]" onPress={() => openProjectDashboard(p.id)}>Open In Dashboard</Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* ── Clients Tab ─────────────────────────────────────── */}
      {viewMode === "list" && outerTab === 1 && (
        <>
          <div className="bg-white dark:bg-[#0F2240] border border-[#E3E8EF] dark:border-[#1E3A5F] rounded-xl shadow-sm p-4">
            <h2 className="text-base font-bold text-[#0A2540] dark:text-[#C9D7E8] mb-3">Client Master</h2>
            <div className="flex flex-wrap gap-2 mb-3">
              {[["Name", "name"], ["Location", "location"], ["Primary Contact", "primaryContactName"], ["Phone", "primaryContactPhone"], ["Email", "primaryContactEmail"]].map(([label, key]) => (
                <Input key={key} size="sm" variant="bordered" label={label} value={clientMasterForm[key]} onChange={(e) => setClientMasterForm((p) => ({ ...p, [key]: e.target.value }))} classNames={inputCls} className="w-40" />
              ))}
              <Button color="primary" size="sm" className="self-end" onPress={() => createClientMaster().catch(() => showToast("error", "Create client failed"))}>Add</Button>
            </div>
            <div className="flex items-center gap-2 mb-3">
              <Button size="sm" variant="flat" isDisabled={clientPagination.page <= 1} onPress={() => setClientPage((p) => Math.max(1, p - 1))}>Prev</Button>
              <span className="text-xs text-[#697386] dark:text-[#7B93AE]">Page {clientPagination.page} / {clientPagination.totalPages} ({clientPagination.total} total)</span>
              <Button size="sm" variant="flat" isDisabled={clientPagination.page >= clientPagination.totalPages} onPress={() => setClientPage((p) => p + 1)}>Next</Button>
            </div>
            <div className="overflow-x-auto">
              <Table aria-label="Clients" classNames={{ th: "text-[#697386] font-semibold text-xs uppercase tracking-wide bg-[#F6F9FC] dark:bg-[#162B47] py-2.5", td: "py-2" }}>
                <TableHeader>
                  <TableColumn>Name</TableColumn>
                  <TableColumn>Location</TableColumn>
                  <TableColumn>Contact</TableColumn>
                  <TableColumn>Phone</TableColumn>
                  <TableColumn>Email</TableColumn>
                  <TableColumn>Projects</TableColumn>
                  <TableColumn>Active</TableColumn>
                  <TableColumn>Actions</TableColumn>
                </TableHeader>
                <TableBody>
                  {clientMasters.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell><Input size="sm" variant="bordered" value={editClientMaster[c.id]?.name ?? c.name} onChange={(e) => setEditClientMaster((p) => ({ ...p, [c.id]: { ...(p[c.id] || {}), name: e.target.value } }))} classNames={inputCls} /></TableCell>
                      <TableCell><Input size="sm" variant="bordered" value={editClientMaster[c.id]?.location ?? c.location ?? ""} onChange={(e) => setEditClientMaster((p) => ({ ...p, [c.id]: { ...(p[c.id] || {}), location: e.target.value } }))} classNames={inputCls} /></TableCell>
                      <TableCell><Input size="sm" variant="bordered" value={editClientMaster[c.id]?.primaryContactName ?? c.primary_contact_name ?? ""} onChange={(e) => setEditClientMaster((p) => ({ ...p, [c.id]: { ...(p[c.id] || {}), primaryContactName: e.target.value } }))} classNames={inputCls} /></TableCell>
                      <TableCell><Input size="sm" variant="bordered" value={editClientMaster[c.id]?.primaryContactPhone ?? c.primary_contact_phone ?? ""} onChange={(e) => setEditClientMaster((p) => ({ ...p, [c.id]: { ...(p[c.id] || {}), primaryContactPhone: e.target.value } }))} classNames={inputCls} /></TableCell>
                      <TableCell><Input size="sm" variant="bordered" value={editClientMaster[c.id]?.primaryContactEmail ?? c.primary_contact_email ?? ""} onChange={(e) => setEditClientMaster((p) => ({ ...p, [c.id]: { ...(p[c.id] || {}), primaryContactEmail: e.target.value } }))} classNames={inputCls} /></TableCell>
                      <TableCell>
                        <p className="text-xs text-[#1A1F36] dark:text-[#C9D7E8]">{Number(c.project_count || 0)}</p>
                        <p className="text-xs text-[#697386] dark:text-[#7B93AE]">{(c.associated_projects || []).slice(0, 2).join(", ")}</p>
                      </TableCell>
                      <TableCell>
                        <NativeSelect value={(editClientMaster[c.id]?.isActive ?? c.is_active) ? "active" : "inactive"} onChange={(e) => setEditClientMaster((p) => ({ ...p, [c.id]: { ...(p[c.id] || {}), isActive: e.target.value === "active" } }))} className="w-24">
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </NativeSelect>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="sm" variant="flat" className="h-7 text-xs min-w-0 px-2" onPress={() => saveClientMaster(c.id).catch(() => showToast("error", "Save client failed"))}>Save</Button>
                          <Button size="sm" color="danger" variant="flat" className="h-7 text-xs min-w-0 px-2" onPress={() => deleteClientMaster(c.id).catch(() => showToast("error", "Delete client failed"))}>Delete</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Excel Import */}
          <div className="bg-white dark:bg-[#0F2240] border border-[#E3E8EF] dark:border-[#1E3A5F] rounded-xl shadow-sm p-4">
            <h2 className="text-base font-bold text-[#0A2540] dark:text-[#C9D7E8] mb-1">Excel Import</h2>
            <p className="text-sm text-[#697386] dark:text-[#7B93AE] mb-3">
              Import projects, clients, and master data from Excel. File should have &quot;ClientProjects List&quot; sheet.
            </p>
            <div className="flex flex-wrap gap-2 items-center">
              <label className="cursor-pointer inline-flex items-center gap-1 px-3 py-1.5 text-xs border border-[#E3E8EF] dark:border-[#1E3A5F] rounded-lg bg-white dark:bg-[#0D1B2E]/50 hover:border-[#635BFF] transition-colors text-[#1A1F36] dark:text-[#C9D7E8]">
                {excelImportFile ? `Selected: ${excelImportFile.name}` : "Select Excel File"}
                <input hidden type="file" accept=".xlsx,.xls" onChange={(e) => setExcelImportFile(e.target.files?.[0] || null)} />
              </label>
              <Button color="primary" size="sm" isDisabled={!excelImportFile || excelImporting} isLoading={excelImporting}
                onPress={() => importExcel().catch(() => showToast("error", "Import failed"))}>
                Import Excel
              </Button>
            </div>
            {excelImportResult && (
              <div className="mt-3 p-3 bg-[#F6F9FC] dark:bg-[#162B47] rounded-lg border border-[#E3E8EF] dark:border-[#1E3A5F]">
                <p className="text-xs font-semibold text-[#1A1F36] dark:text-[#C9D7E8] mb-1">Import Results:</p>
                <p className="text-xs text-[#697386] dark:text-[#7B93AE]">
                  Projects: {excelImportResult.projectsImported} | Clients: {excelImportResult.clientsCreated} | Brands: {excelImportResult.brandsCreated} | Product Types: {excelImportResult.productTypesCreated} | Items: {excelImportResult.itemsCreated} | BOM Items: {excelImportResult.bomItemsCreated}
                </p>
                {excelImportResult.errors?.length > 0 && <p className="text-xs text-[#DF1B41] mt-1">Errors: {excelImportResult.errors.length}</p>}
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Dashboard Mode ──────────────────────────────────── */}
      {viewMode === "dashboard" && (
        <>
          <Button variant="bordered" size="sm" className="border-[#E3E8EF] dark:border-[#1E3A5F]" onPress={goBackToList}>← Back to Projects</Button>

          {/* Project header */}
          <div className="bg-white dark:bg-[#0F2240] border border-[#E3E8EF] dark:border-[#1E3A5F] rounded-xl shadow-sm p-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
              <h2 className="text-base font-bold text-[#0A2540] dark:text-[#C9D7E8]">Project Dashboard</h2>
              <div className="flex flex-col sm:flex-row gap-2">
                <NativeSelect value={projectId} onChange={(e) => setProjectId(e.target.value)} className="sm:min-w-[260px]">
                  {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </NativeSelect>
                <Button variant="bordered" size="sm" isDisabled={!projectId} className="border-[#E3E8EF] dark:border-[#1E3A5F]"
                  onPress={async () => {
                    if (!projectId) return;
                    const res = await api.get(`/projects/${projectId}/report.pdf`, { responseType: "blob" });
                    const url = URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
                    const a = document.createElement("a"); a.href = url; a.download = `inka_report_${projectId}.pdf`; a.click(); URL.revokeObjectURL(url);
                  }}>
                  Download Report
                </Button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
              <Chip size="sm" variant="flat" color={openCr ? "warning" : "success"} classNames={{ base: "h-5", content: "text-xs px-1" }}>Open CR: {openCr ? "Yes" : "No"}</Chip>
              <Chip size="sm" variant="flat" color="primary" classNames={{ base: "h-5", content: "text-xs px-1" }}>BOM: INR {Number(dashboard?.summary?.total_scope_value || 0).toLocaleString()}</Chip>
              <Chip size="sm" variant="flat" color="warning" classNames={{ base: "h-5", content: "text-xs px-1" }}>Delivered: INR {Number(dashboard?.summary?.total_delivered_value || 0).toLocaleString()}</Chip>
              <Chip size="sm" variant="flat" color="secondary" classNames={{ base: "h-5", content: "text-xs px-1" }}>Balance: INR {Number(dashboard?.summary?.total_balance_value || 0).toLocaleString()}</Chip>
              <Chip size="sm" variant="flat" classNames={{ base: "h-5", content: "text-xs px-1" }}>Visits: {Number(dashboard?.summary?.visit_count || 0)}</Chip>
            </div>

            {dashboard?.project && (
              <div className="bg-[#F6F9FC] dark:bg-[#162B47] rounded-lg p-3 border border-[#E3E8EF] dark:border-[#1E3A5F]">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                  <div><p className="text-xs text-[#697386] dark:text-[#7B93AE]">Project</p><p className="text-sm text-[#1A1F36] dark:text-[#C9D7E8]">{dashboard.project.name}</p></div>
                  <div><p className="text-xs text-[#697386] dark:text-[#7B93AE]">Client</p><p className="text-sm text-[#1A1F36] dark:text-[#C9D7E8]">{dashboard.project.client_name}</p></div>
                  <div><p className="text-xs text-[#697386] dark:text-[#7B93AE]">Location</p><p className="text-sm text-[#1A1F36] dark:text-[#C9D7E8]">{dashboard.project.location}</p></div>
                  <div>
                    <p className="text-xs text-[#697386] dark:text-[#7B93AE] mb-1">Status</p>
                    <NativeSelect value={dashboard.project.status}
                      onChange={async (e) => { await api.patch(`/projects/${projectId}`, { status: e.target.value }); showToast("success", "Status updated"); await loadProject(projectId); await fetchProjects(); }}>
                      <option value="active">Active</option>
                      <option value="on_hold">On Hold</option>
                      <option value="completed">Completed</option>
                    </NativeSelect>
                  </div>
                </div>

                {dashboard.project.drive_link && (
                  <Button size="sm" variant="bordered" className="border-[#E3E8EF] dark:border-[#1E3A5F] mb-2" onPress={() => window.open(dashboard.project.drive_link, "_blank", "noopener,noreferrer")}>Open Drive Link</Button>
                )}

                <div className="flex flex-wrap gap-2 mb-3">
                  <label className="cursor-pointer inline-flex items-center gap-1 px-3 py-1.5 text-xs border border-[#E3E8EF] dark:border-[#1E3A5F] rounded-lg bg-white dark:bg-[#0D1B2E]/50 hover:border-[#635BFF] transition-colors text-[#1A1F36] dark:text-[#C9D7E8]">
                    {driveUploadFile ? `Selected: ${driveUploadFile.name}` : "Select File For Drive"}
                    <input hidden type="file" onChange={(e) => setDriveUploadFile(e.target.files?.[0] || null)} />
                  </label>
                  <Button size="sm" color="primary" isDisabled={!driveUploadFile || driveUploading} isLoading={driveUploading} onPress={uploadDriveFile}>Upload To Google Drive</Button>
                </div>

                {driveFiles.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs text-[#697386] dark:text-[#7B93AE] mb-1">Drive Files</p>
                    <div className="flex flex-col gap-0.5">
                      {driveFiles.slice(0, 8).map((f) => (
                        <button key={f.id} className="text-left text-xs text-[#635BFF] hover:underline py-0.5" onClick={() => window.open(f.webViewLink || f.webContentLink, "_blank", "noopener,noreferrer")}>{f.name}</button>
                      ))}
                    </div>
                  </div>
                )}

                <Divider className="my-3 bg-[#E3E8EF] dark:bg-[#1E3A5F]" />
                <p className="text-xs text-[#697386] dark:text-[#7B93AE] mb-2">Project Contacts</p>
                <div className="space-y-2 mb-3">
                  {projectContacts.map((c, idx) => (
                    <div key={`contact-${idx}`} className="flex flex-wrap gap-2 items-end">
                      {[["Role", "roleName", c.roleName || c.role_name || ""], ["Name", "contactName", c.contactName || c.contact_name || ""], ["Phone", "phone", c.phone || ""], ["Email", "email", c.email || ""]].map(([lbl, fld, val]) => (
                        <Input key={fld} size="sm" variant="bordered" label={lbl} value={val} onChange={(e) => setProjectContacts((prev) => prev.map((x, i) => i === idx ? { ...x, [fld]: e.target.value } : x))} classNames={inputCls} className="w-32" />
                      ))}
                      <Button size="sm" color="danger" variant="flat" className="h-7 text-xs" onPress={() => setProjectContacts((prev) => prev.filter((_, i) => i !== idx))}>Remove</Button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <Button size="sm" variant="bordered" className="border-[#E3E8EF] dark:border-[#1E3A5F]" onPress={() => setProjectContacts((prev) => [...prev, { roleName: "Civil Engineer", contactName: "", phone: "", email: "", notes: "" }])}>Add Contact</Button>
                    <Button size="sm" color="primary" onPress={saveContacts}>Save Contacts</Button>
                  </div>
                </div>

                <Divider className="my-3 bg-[#E3E8EF] dark:bg-[#1E3A5F]" />
                <Textarea
                  label="Visit Notes"
                  value={visitNotes}
                  onChange={(e) => setVisitNotes(e.target.value)}
                  minRows={3}
                  variant="bordered"
                  classNames={{ inputWrapper: "border-[#E3E8EF] dark:border-[#1E3A5F] bg-white dark:bg-[#0D1B2E]/50 rounded-md mb-2" }}
                />
                <Button color="primary" size="sm" onPress={logVisit}>Log Site Visit</Button>
                <div className="mt-2 space-y-1">
                  {visits.slice(0, 5).map((v) => (
                    <p key={v.id} className="text-xs text-[#697386] dark:text-[#7B93AE]">
                      {new Date(v.created_at).toLocaleString()} | {v.engineer_name || "Engineer"} | {v.notes || "-"}
                    </p>
                  ))}
                </div>

                <Divider className="my-3 bg-[#E3E8EF] dark:bg-[#1E3A5F]" />
                <p className="text-sm font-semibold text-[#1A1F36] dark:text-[#C9D7E8] mb-2">Visit Analytics</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {[["Total Visits", visitSummary?.totals?.total_visits || 0], ["Engineers", visitSummary?.totals?.engineer_count || 0], ["First Visit", visitSummary?.totals?.first_visit_date || "-"], ["Last Visit", visitSummary?.totals?.last_visit_date || "-"]].map(([lbl, val]) => (
                    <Chip key={lbl} size="sm" variant="flat" classNames={{ base: "h-5", content: "text-xs px-1" }}>{lbl}: {val}</Chip>
                  ))}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                  {[["Engineer-wise Visits", visitSummary?.byEngineer || [], "engineer_id", "engineer_name", "visit_count"], ["Month-wise Visits", visitSummary?.byMonth || [], "month_key", "month_key", "visit_count"]].map(([title, rows, key, nameCol, countCol]) => (
                    <div key={title} className="bg-white dark:bg-[#0F2240] border border-[#E3E8EF] dark:border-[#1E3A5F] rounded-lg p-3">
                      <p className="text-xs text-[#697386] dark:text-[#7B93AE] mb-2">{title}</p>
                      <table className="w-full text-xs">
                        <thead><tr><th className="text-left text-[#697386] pb-1">Name</th><th className="text-right text-[#697386] pb-1">Visits</th></tr></thead>
                        <tbody>{rows.map((r) => <tr key={r[key]}><td className="text-[#1A1F36] dark:text-[#C9D7E8]">{r[nameCol]}</td><td className="text-right text-[#1A1F36] dark:text-[#C9D7E8]">{r[countCol]}</td></tr>)}</tbody>
                      </table>
                    </div>
                  ))}
                </div>

                <Divider className="my-3 bg-[#E3E8EF] dark:bg-[#1E3A5F]" />
                <p className="text-sm font-semibold text-[#1A1F36] dark:text-[#C9D7E8] mb-2">Activity Feed</p>
                <div className="space-y-2">
                  {activity.slice(0, 8).map((a) => (
                    <div key={a.id} className="p-2.5 bg-white dark:bg-[#0F2240] border border-[#E3E8EF] dark:border-[#1E3A5F] rounded-lg">
                      <p className="text-sm font-semibold text-[#1A1F36] dark:text-[#C9D7E8]">{a.action_type}</p>
                      <p className="text-xs text-[#697386] dark:text-[#7B93AE]">{new Date(a.created_at).toLocaleString()} {a.user_name ? `| ${a.user_name}` : ""}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Inner tabs */}
          <div className="bg-white dark:bg-[#0F2240] border border-[#E3E8EF] dark:border-[#1E3A5F] rounded-xl shadow-sm px-3 pt-1">
            <Tabs selectedKey={String(tab)} onSelectionChange={(k) => setTab(Number(k))} variant="underlined"
              classNames={{ tabList: "w-full border-b-0", tab: "text-sm font-medium", cursor: "bg-[#635BFF]" }}>
              <Tab key="0" title="BOM" />
              <Tab key="1" title="Change Requests" />
              <Tab key="2" title="Deliveries" />
            </Tabs>
          </div>

          {loading && <div className="flex justify-center py-6"><Spinner color="primary" /></div>}

          {/* BOM Tab */}
          {tab === 0 && !loading && (
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-base font-bold text-[#0A2540] dark:text-[#C9D7E8]">Structured BOM</h3>
                <Button color="primary" size="sm" isDisabled>Add Item via CR</Button>
              </div>
              <Accordion variant="bordered" className="border-[#E3E8EF] dark:border-[#1E3A5F]">
                {grouped.map(([floor, rows]) => (
                  <AccordionItem key={floor} title={<span className="text-sm font-semibold text-[#1A1F36] dark:text-[#C9D7E8]">Floor: {floor}</span>}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-2">
                      {rows.map((r) => (
                        <div key={r.id} className="p-3 bg-[#F6F9FC] dark:bg-[#162B47] border border-[#E3E8EF] dark:border-[#1E3A5F] rounded-lg">
                          <p className="text-sm font-semibold text-[#1A1F36] dark:text-[#C9D7E8]">{r.brand_name} {r.model_number}</p>
                          <p className="text-xs text-[#697386] dark:text-[#7B93AE]">{r.product_type_name}</p>
                          <p className="text-xs text-[#697386] dark:text-[#7B93AE]">Location: {r.location_description || "-"}</p>
                          <Divider className="my-2 bg-[#E3E8EF] dark:bg-[#1E3A5F]" />
                          <div className="flex flex-wrap gap-1.5">
                            <Chip size="sm" variant="flat" color="primary" classNames={{ base: "h-5", content: "text-xs px-1" }}>Approved {r.quantity}</Chip>
                            <Chip size="sm" variant="flat" color="success" classNames={{ base: "h-5", content: "text-xs px-1" }}>Delivered {r.delivered_quantity}</Chip>
                            <Chip size="sm" variant="flat" color="warning" classNames={{ base: "h-5", content: "text-xs px-1" }}>Balance {Number(r.quantity) - Number(r.delivered_quantity)}</Chip>
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          )}

          {/* Change Requests Tab */}
          {tab === 1 && !loading && (
            <div className="bg-white dark:bg-[#0F2240] border border-[#E3E8EF] dark:border-[#1E3A5F] rounded-xl shadow-sm p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <h3 className="text-base font-bold text-[#0A2540] dark:text-[#C9D7E8]">Single Change Request Governance</h3>
                {!openCr ? (
                  <Button color="primary" size="sm" isDisabled={!projectId || !canEditScope} onPress={createCr}>Create Change Request</Button>
                ) : (
                  <Chip size="sm" variant="flat" color="warning" classNames={{ base: "h-6", content: "text-xs px-2" }}>CR {openCr.id.slice(0, 8)} | {openCr.status.toUpperCase()}</Chip>
                )}
              </div>

              {openCr && openCr.status !== "pending" && canEditScope && (
                <div className="space-y-3 mb-4">
                  <Button color="primary" size="sm" onPress={() => setOpenAdd(true)}>Add Item (CR)</Button>
                  <HierarchySelector categories={masterData.categories} productTypes={masterData.productTypes} brands={masterData.brands} items={masterData.items} value={crSelector} onChange={(change) => setCrSelector((prev) => ({ ...prev, ...change }))} />
                  <div className="flex flex-wrap gap-3">
                    <NativeSelect label="Change Type" value={crChangeType} onChange={(e) => setCrChangeType(e.target.value)} className="w-40">
                      <option value="add">Add</option>
                      <option value="modify">Modify Quantity</option>
                      <option value="delete">Delete</option>
                    </NativeSelect>
                    <Input size="sm" variant="bordered" type="number" label="New Quantity" value={String(crQty)} onChange={(e) => setCrQty(Number(e.target.value || 0))} isDisabled={crChangeType === "delete"} classNames={inputCls} className="w-32" />
                    <Input size="sm" variant="bordered" label="Floor" value={crFloorLabel} onChange={(e) => setCrFloorLabel(e.target.value)} classNames={inputCls} className="w-32" />
                    <Input size="sm" variant="bordered" label="Location Description" value={crLocationDescription} onChange={(e) => setCrLocationDescription(e.target.value)} classNames={inputCls} className="flex-1 min-w-[160px]" />
                    <Button color="primary" size="sm" className="self-end" onPress={addCrItem}>Add Delta</Button>
                    <Button variant="bordered" size="sm" className="self-end border-[#E3E8EF] dark:border-[#1E3A5F]" onPress={submitCr}>Submit CR</Button>
                  </div>
                </div>
              )}

              {openCr && openCr.status === "pending" && (role === "project_manager" || role === "admin") && (
                <div className="flex gap-3 mb-4">
                  <Button color="success" size="sm" onPress={approveCr}>Approve CR</Button>
                  <Button color="danger" variant="bordered" size="sm" onPress={rejectCr}>Reject CR</Button>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-[#697386] dark:text-[#7B93AE]">CR changes are delta-based and applied only on approval.</p>
                </div>
                <div className="bg-[#F6F9FC] dark:bg-[#162B47] border border-[#E3E8EF] dark:border-[#1E3A5F] rounded-lg p-3">
                  <p className="text-sm font-semibold text-[#1A1F36] dark:text-[#C9D7E8] mb-1">Live Diff Panel</p>
                  <p className="text-xs text-[#697386] dark:text-[#7B93AE] mb-2">Total Scope Qty Delta: {crDiff.summary?.totalDeltaQty ?? 0}</p>
                  <Table aria-label="CR Diff" classNames={{ th: "text-[#697386] text-xs bg-transparent py-1", td: "py-1 text-xs" }}>
                    <TableHeader>
                      <TableColumn>Model</TableColumn>
                      <TableColumn>Type</TableColumn>
                      <TableColumn>Floor</TableColumn>
                      <TableColumn>Before</TableColumn>
                      <TableColumn>After</TableColumn>
                    </TableHeader>
                    <TableBody>
                      {(crDiff.diff || []).map((d) => (
                        <TableRow key={`${d.itemId}-${d.changeType}`}>
                          <TableCell>{d.modelNumber}</TableCell>
                          <TableCell>{d.changeType}</TableCell>
                          <TableCell>{d.floorLabel || "Unassigned"}</TableCell>
                          <TableCell>{d.beforeQty}</TableCell>
                          <TableCell>{d.afterQty}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}

          {/* Deliveries Tab */}
          {tab === 2 && !loading && (
            <div className="bg-white dark:bg-[#0F2240] border border-[#E3E8EF] dark:border-[#1E3A5F] rounded-xl shadow-sm p-4">
              <h3 className="text-base font-bold text-[#0A2540] dark:text-[#C9D7E8] mb-3">Site Deliveries</h3>
              <div className="space-y-3 mb-4">
                <HierarchySelector categories={masterData.categories} productTypes={masterData.productTypes} brands={masterData.brands} items={masterData.items.filter((x) => (dashboard?.bom || []).some((b) => b.item_id === x.id))} value={deliverySelector} onChange={(change) => setDeliverySelector((prev) => ({ ...prev, ...change }))} />
                <div className="flex flex-wrap gap-3">
                  <Input size="sm" variant="bordered" type="number" label="Delivered Qty" value={String(deliveryQty)} onChange={(e) => setDeliveryQty(Number(e.target.value || 0))} classNames={inputCls} className="w-32" />
                  <Input size="sm" variant="bordered" label="Notes" value={deliveryNotes} onChange={(e) => setDeliveryNotes(e.target.value)} classNames={inputCls} className="flex-1 min-w-[200px]" />
                  <label className="cursor-pointer inline-flex items-center gap-1 px-3 py-1.5 text-xs border border-[#E3E8EF] dark:border-[#1E3A5F] rounded-lg bg-white dark:bg-[#0D1B2E]/50 hover:border-[#635BFF] transition-colors self-end text-[#1A1F36] dark:text-[#C9D7E8]">
                    {deliveryPhotoFile ? "Photo Selected" : "Upload Photo"}
                    <input hidden type="file" accept="image/*" onChange={(e) => setDeliveryPhotoFile(e.target.files?.[0] || null)} />
                  </label>
                  <Button color="primary" size="sm" className="self-end" onPress={logDelivery}>Log</Button>
                </div>
              </div>
              {selectedDeliveryBom && (
                <div className="flex flex-wrap gap-2 mb-4">
                  <Chip size="sm" variant="flat" classNames={{ base: "h-5", content: "text-xs px-1" }}>Approved {selectedDeliveryBom.quantity}</Chip>
                  <Chip size="sm" variant="flat" color="success" classNames={{ base: "h-5", content: "text-xs px-1" }}>Delivered {selectedDeliveryBom.delivered_quantity}</Chip>
                  <Chip size="sm" variant="flat" color="warning" classNames={{ base: "h-5", content: "text-xs px-1" }}>Balance {Number(selectedDeliveryBom.quantity) - Number(selectedDeliveryBom.delivered_quantity)}</Chip>
                </div>
              )}
              <div className="space-y-2">
                {deliveries.slice(0, 8).map((d) => (
                  <div key={d.id} className="p-3 bg-[#F6F9FC] dark:bg-[#162B47] border border-[#E3E8EF] dark:border-[#1E3A5F] rounded-lg">
                    <p className="text-sm font-semibold text-[#1A1F36] dark:text-[#C9D7E8]">{d.full_name}</p>
                    <p className="text-xs text-[#697386] dark:text-[#7B93AE]">Qty {d.quantity} | {new Date(d.created_at).toLocaleString()} | {d.engineer_name || "Unknown"}</p>
                    <p className="text-xs text-[#697386] dark:text-[#7B93AE]">Notes: {d.notes || "-"} | Photo: {d.photo_url || "-"}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Reports Tab ─────────────────────────────────────── */}
      {viewMode === "list" && outerTab === 2 && (
        <div className="bg-white dark:bg-[#0F2240] border border-[#E3E8EF] dark:border-[#1E3A5F] rounded-xl shadow-sm p-4">
          <h2 className="text-base font-bold text-[#0A2540] dark:text-[#C9D7E8] mb-1">Reports</h2>
          <p className="text-sm text-[#697386] dark:text-[#7B93AE] mb-4">Select a project to download its PDF report.</p>
          <div className="flex flex-wrap gap-3 items-end mb-4">
            <NativeSelect value={projectId} onChange={(e) => setProjectId(e.target.value)} className="min-w-[280px]">
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name} — {p.client_name || "No client"}</option>)}
            </NativeSelect>
            <Button color="primary" size="sm" isDisabled={!projectId}
              onPress={async () => {
                if (!projectId) return;
                const res = await api.get(`/projects/${projectId}/report.pdf`, { responseType: "blob" });
                const url = URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
                const a = document.createElement("a"); a.href = url; a.download = `inka_report_${projectId}.pdf`; a.click(); URL.revokeObjectURL(url);
              }}>
              Download PDF Report
            </Button>
          </div>
          {projects.length > 0 && (
            <Table aria-label="Reports" classNames={{ th: "text-[#697386] font-semibold text-xs uppercase tracking-wide bg-[#F6F9FC] dark:bg-[#162B47] py-2.5", td: "py-2.5 text-sm" }}>
              <TableHeader>
                <TableColumn>Project</TableColumn>
                <TableColumn>Client</TableColumn>
                <TableColumn>Status</TableColumn>
                <TableColumn>Download</TableColumn>
              </TableHeader>
              <TableBody>
                {projects.map((p) => (
                  <TableRow key={p.id} className="hover:bg-[#F0F4F9] dark:hover:bg-[#162B47] transition-colors">
                    <TableCell className="text-[#1A1F36] dark:text-[#C9D7E8]">{p.name}</TableCell>
                    <TableCell className="text-[#697386] dark:text-[#7B93AE]">{p.client_name || "-"}</TableCell>
                    <TableCell><Chip size="sm" variant="flat" classNames={{ base: "h-5", content: "text-xs px-1" }}>{p.status}</Chip></TableCell>
                    <TableCell>
                      <Button size="sm" variant="bordered" className="h-7 text-xs border-[#E3E8EF] dark:border-[#1E3A5F]"
                        onPress={async () => {
                          const res = await api.get(`/projects/${p.id}/report.pdf`, { responseType: "blob" });
                          const url = URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
                          const a = document.createElement("a"); a.href = url; a.download = `inka_report_${p.id}.pdf`; a.click(); URL.revokeObjectURL(url);
                        }}>PDF</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      )}

      {/* ── Modals ─────────────────────────────────────────── */}
      {/* Add BOM Item */}
      <Modal isOpen={openAdd} onOpenChange={setOpenAdd} size="2xl" scrollBehavior="inside">
        <ModalContent>
          {(onClose) => (<>
            <ModalHeader className="border-b border-[#E3E8EF] dark:border-[#1E3A5F] text-[#0A2540] dark:text-[#C9D7E8]">Add BOM Item</ModalHeader>
            <ModalBody className="py-4">
              <HierarchySelector categories={masterData.categories} productTypes={masterData.productTypes} brands={masterData.brands} items={masterData.items} value={selector} onChange={(change) => setSelector((prev) => ({ ...prev, ...change }))} />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                <Input size="sm" variant="bordered" type="number" label="Quantity" value={String(qty)} onChange={(e) => setQty(Number(e.target.value || 0))} classNames={inputCls} />
                <Input size="sm" variant="bordered" type="number" label="Rate" value={String(rate)} onChange={(e) => setRate(Number(e.target.value || 0))} classNames={inputCls} />
                <Input size="sm" variant="bordered" label="Unit" value={selectedModel?.unit_of_measure || "-"} isDisabled classNames={inputCls} />
                <Input size="sm" variant="bordered" label="Floor (GF / FF / etc)" value={floorLabel} onChange={(e) => setFloorLabel(e.target.value)} classNames={inputCls} />
                <Input size="sm" variant="bordered" label="Location Description" value={locationDescription} onChange={(e) => setLocationDescription(e.target.value)} classNames={{ ...inputCls, base: "md:col-span-2" }} />
              </div>
            </ModalBody>
            <ModalFooter className="border-t border-[#E3E8EF] dark:border-[#1E3A5F] gap-2">
              <Button variant="bordered" size="sm" className="border-[#E3E8EF] dark:border-[#1E3A5F]" onPress={onClose}>Cancel</Button>
              <Button color="primary" size="sm" onPress={addBomItem}>Save</Button>
            </ModalFooter>
          </>)}
        </ModalContent>
      </Modal>

      {/* Create Project */}
      <Modal isOpen={openCreateProject} onOpenChange={setOpenCreateProject} size="2xl" scrollBehavior="inside">
        <ModalContent>
          {(onClose) => (<>
            <ModalHeader className="border-b border-[#E3E8EF] dark:border-[#1E3A5F] text-[#0A2540] dark:text-[#C9D7E8]">Create Project</ModalHeader>
            <ModalBody className="py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input size="sm" variant="bordered" label="Project Name" value={newProject.name} onChange={(e) => setNewProject((p) => ({ ...p, name: e.target.value }))} classNames={inputCls} />
                <NativeSelect label="Client" value={newProject.clientId} onChange={(e) => { const sel = clientMasters.find((c) => c.id === e.target.value); setNewProject((p) => ({ ...p, clientId: e.target.value, clientName: sel?.name || "", location: sel?.location || p.location })); }}>
                  <option value="">None</option>
                  {clientMasters.filter((c) => c.is_active).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </NativeSelect>
                <Input size="sm" variant="bordered" label="Location" value={newProject.location} onChange={(e) => setNewProject((p) => ({ ...p, location: e.target.value }))} classNames={inputCls} />
                <Input size="sm" variant="bordered" label="Drive Link (Optional)" value={newProject.driveLink} onChange={(e) => setNewProject((p) => ({ ...p, driveLink: e.target.value }))} classNames={inputCls} />
                <Input size="sm" variant="bordered" type="date" label="Start Date" value={newProject.startDate} onChange={(e) => setNewProject((p) => ({ ...p, startDate: e.target.value }))} classNames={inputCls} />
                <div>
                  <label className="inka-label">Assigned Engineers</label>
                  <select multiple value={newProject.engineerIds} onChange={(e) => setNewProject((p) => ({ ...p, engineerIds: Array.from(e.target.selectedOptions, (o) => o.value) }))}
                    className="w-full px-3 py-2 text-sm rounded-md border border-[#E3E8EF] dark:border-[#1E3A5F] bg-white dark:bg-[#0D1B2E]/50 text-[#1A1F36] dark:text-[#C9D7E8] focus:border-[#635BFF] outline-none h-24">
                    {engineers.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
                <NativeSelect label="Category Sequence Mode" value={newProject.categorySequenceMode ? "yes" : "no"} onChange={(e) => setNewProject((p) => ({ ...p, categorySequenceMode: e.target.value === "yes" }))}>
                  <option value="no">Disabled</option>
                  <option value="yes">Enabled</option>
                </NativeSelect>
              </div>
            </ModalBody>
            <ModalFooter className="border-t border-[#E3E8EF] dark:border-[#1E3A5F] gap-2">
              <Button variant="bordered" size="sm" className="border-[#E3E8EF] dark:border-[#1E3A5F]" onPress={onClose}>Cancel</Button>
              <Button color="primary" size="sm" onPress={createProject}>Save</Button>
            </ModalFooter>
          </>)}
        </ModalContent>
      </Modal>

      {/* Edit Project */}
      <Modal isOpen={editProjectOpen} onOpenChange={setEditProjectOpen} size="2xl" scrollBehavior="inside">
        <ModalContent>
          {(onClose) => (<>
            <ModalHeader className="border-b border-[#E3E8EF] dark:border-[#1E3A5F] text-[#0A2540] dark:text-[#C9D7E8]">Edit Project</ModalHeader>
            <ModalBody className="py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input size="sm" variant="bordered" label="Project Name" value={editProjectForm.name} onChange={(e) => setEditProjectForm((p) => ({ ...p, name: e.target.value }))} classNames={inputCls} />
                <NativeSelect label="Client" value={editProjectForm.clientId} onChange={(e) => { const sel = clientMasters.find((c) => c.id === e.target.value); setEditProjectForm((p) => ({ ...p, clientId: e.target.value, clientName: sel?.name || "", location: sel?.location || p.location })); }}>
                  <option value="">None</option>
                  {clientMasters.filter((c) => c.is_active).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </NativeSelect>
                <Input size="sm" variant="bordered" label="Location" value={editProjectForm.location} onChange={(e) => setEditProjectForm((p) => ({ ...p, location: e.target.value }))} classNames={inputCls} />
                <Input size="sm" variant="bordered" label="Drive Link (Optional)" value={editProjectForm.driveLink} onChange={(e) => setEditProjectForm((p) => ({ ...p, driveLink: e.target.value }))} classNames={inputCls} />
                <Input size="sm" variant="bordered" type="date" label="Start Date" value={editProjectForm.startDate} onChange={(e) => setEditProjectForm((p) => ({ ...p, startDate: e.target.value }))} classNames={inputCls} />
                <div>
                  <label className="inka-label">Assigned Engineers</label>
                  <select multiple value={editProjectForm.engineerIds} onChange={(e) => setEditProjectForm((p) => ({ ...p, engineerIds: Array.from(e.target.selectedOptions, (o) => o.value) }))}
                    className="w-full px-3 py-2 text-sm rounded-md border border-[#E3E8EF] dark:border-[#1E3A5F] bg-white dark:bg-[#0D1B2E]/50 text-[#1A1F36] dark:text-[#C9D7E8] focus:border-[#635BFF] outline-none h-24">
                    {engineers.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
                <NativeSelect label="Category Sequence Mode" value={editProjectForm.categorySequenceMode ? "yes" : "no"} onChange={(e) => setEditProjectForm((p) => ({ ...p, categorySequenceMode: e.target.value === "yes" }))}>
                  <option value="no">Disabled</option>
                  <option value="yes">Enabled</option>
                </NativeSelect>
              </div>
            </ModalBody>
            <ModalFooter className="border-t border-[#E3E8EF] dark:border-[#1E3A5F] gap-2">
              <Button variant="bordered" size="sm" className="border-[#E3E8EF] dark:border-[#1E3A5F]" onPress={onClose}>Cancel</Button>
              <Button color="primary" size="sm" onPress={() => saveEditProject().catch(() => showToast("error", "Update project failed"))}>Save</Button>
            </ModalFooter>
          </>)}
        </ModalContent>
      </Modal>

      {/* Delete Confirm */}
      <Modal isOpen={deleteProjectOpen} onOpenChange={setDeleteProjectOpen} size="sm">
        <ModalContent>
          {(onClose) => (<>
            <ModalHeader className="border-b border-[#E3E8EF] dark:border-[#1E3A5F] text-[#0A2540] dark:text-[#C9D7E8]">Delete Project</ModalHeader>
            <ModalBody className="py-4">
              <p className="text-sm text-[#1A1F36] dark:text-[#C9D7E8]">Are you sure you want to delete this project? This action cannot be undone.</p>
            </ModalBody>
            <ModalFooter className="border-t border-[#E3E8EF] dark:border-[#1E3A5F] gap-2">
              <Button variant="bordered" size="sm" className="border-[#E3E8EF] dark:border-[#1E3A5F]" onPress={onClose}>Cancel</Button>
              <Button color="danger" size="sm" onPress={() => confirmDeleteProject().catch(() => showToast("error", "Delete project failed"))}>Delete</Button>
            </ModalFooter>
          </>)}
        </ModalContent>
      </Modal>

      {/* Toast */}
      {toast.open && (
        <div className={`fixed bottom-4 right-4 z-50 max-w-sm px-4 py-3 rounded-xl shadow-xl text-sm text-white flex items-center gap-3 ${toastBg}`}>
          <span className="flex-1">{toast.text}</span>
          <button onClick={() => setToast((p) => ({ ...p, open: false }))} className="opacity-70 hover:opacity-100 text-lg leading-none">×</button>
        </div>
      )}
    </div>
  );
}
