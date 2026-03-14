import { useEffect, useMemo, useState } from "react";
import { Button, Chip, Input, Select, SelectItem, Tab, Tabs } from "@heroui/react";
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

  function showToast(severity, text) {
    setToast({ open: true, severity, text });
    setTimeout(() => setToast((p) => ({ ...p, open: false })), 2500);
  }

  function queueOffline(action) {
    const next = [...offlineQueue, { ...action, queuedAt: new Date().toISOString() }];
    setOfflineQueue(next);
    saveOfflineQueue(next);
    showToast("warning", "Offline queued. Sync when online.");
  }

  async function syncOffline() {
    let queue = [...offlineQueue];
    const remaining = [];
    const conflictRows = [];
    for (const action of queue) {
      try {
        if (action.type === "status") {
          await api.patch(`/projects/${action.projectId}/bom-items/${action.bomItemId}/status`, { status: action.status });
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
          conflictRows.push({ ...action, reason: error?.response?.data?.error || "Conflict" });
        } else {
          remaining.push(action);
        }
      }
    }
    setOfflineQueue(remaining);
    saveOfflineQueue(remaining);
    if (conflictRows.length) setConflicts((prev) => [...conflictRows, ...prev].slice(0, 20));
    showToast("success", `Sync complete. Pending: ${remaining.length}`);
    await loadProjectData(projectId);
  }

  async function retryConflict(conflict, idx) {
    try {
      if (conflict.type === "status") {
        await api.patch(`/projects/${conflict.projectId}/bom-items/${conflict.bomItemId}/status`, { status: conflict.status });
      } else if (conflict.type === "delivery") {
        await api.post(`/projects/${conflict.projectId}/deliveries`, {
          itemId: conflict.itemId,
          quantity: conflict.quantity,
          notes: conflict.notes || "",
          photoUrl: conflict.photoUrl || undefined,
        });
      }
      setConflicts((prev) => prev.filter((_, i) => i !== idx));
      showToast("success", "Conflict retried successfully");
      await loadProjectData(projectId);
    } catch (error) {
      showToast("error", error?.response?.data?.error || "Retry failed");
    }
  }

  function discardConflict(idx) {
    setConflicts((prev) => prev.filter((_, i) => i !== idx));
  }

  useEffect(() => { loadProjects().catch(() => {}); }, []);
  useEffect(() => { loadProjectData(projectId).catch(() => {}); }, [projectId]);

  useEffect(() => {
    function handleOnline() { syncOffline().catch(() => {}); }
    window.addEventListener("online", handleOnline);
    const timer = setInterval(() => {
      if (navigator.onLine && offlineQueue.length) syncOffline().catch(() => {});
    }, 10000);
    return () => {
      window.removeEventListener("online", handleOnline);
      clearInterval(timer);
    };
  }, [offlineQueue, projectId]);

  async function updateStatus(bomItemId, status) {
    try {
      await api.patch(`/projects/${projectId}/bom-items/${bomItemId}/status`, { status });
      showToast("success", "Status updated");
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
        const uploaded = await api.post("/uploads/photo", fd, { headers: { "Content-Type": "multipart/form-data" } });
        photoUrl = uploaded.data.photoUrl;
      }
      await api.post(`/projects/${projectId}/deliveries`, {
        itemId,
        quantity: qty,
        notes: deliveryNotes[itemId] || "",
        photoUrl,
      });
      showToast("success", "Delivery logged");
      setDeliveryQty((prev) => ({ ...prev, [itemId]: "" }));
      setDeliveryNotes((prev) => ({ ...prev, [itemId]: "" }));
      setDeliveryPhotoFile((prev) => ({ ...prev, [itemId]: null }));
      await loadProjectData(projectId);
    } catch {
      queueOffline({ type: "delivery", projectId, itemId, quantity: qty, notes: deliveryNotes[itemId] || "", photoUrl: undefined });
    }
  }

  async function logVisit() {
    if (!projectId) return;
    await api.post(`/projects/${projectId}/visits`, { notes: visitNotes || "" });
    setVisitNotes("");
    showToast("success", "Visit logged");
    await loadProjectData(projectId);
  }

  const toastBg = toast.severity === "error" ? "bg-[#DF1B41]" : toast.severity === "warning" ? "bg-[#B7791F]" : "bg-[#1A9E5D]";

  return (
    <div className="space-y-3">
      {/* Header panel */}
      <div className="bg-white dark:bg-[#0F2240] border border-[#E3E8EF] dark:border-[#1E3A5F] rounded-xl shadow-sm p-4">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
          <h2 className="text-base font-bold text-[#0A2540] dark:text-[#C9D7E8]">Engineer Mobile App</h2>
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <Select
              size="sm"
              variant="bordered"
              label="Project"
              selectedKeys={projectId ? [String(projectId)] : []}
              onChange={(e) => setProjectId(e.target.value)}
              className="sm:min-w-[280px]"
              classNames={{ trigger: "border-[#E3E8EF] dark:border-[#1E3A5F] bg-white dark:bg-[#0D1B2E]/50 rounded-md h-9" }}
            >
              {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
            </Select>
            <Button variant="bordered" size="sm" className="w-full sm:w-auto border-[#E3E8EF] dark:border-[#1E3A5F]" onPress={syncOffline}>
              Sync ({offlineQueue.length})
            </Button>
            <Button color="primary" size="sm" className="w-full sm:w-auto" onPress={logVisit}>
              Log Visit
            </Button>
          </div>
        </div>
        <div className="mt-3">
          <Input
            size="sm"
            variant="bordered"
            label="Visit Notes"
            value={visitNotes}
            onValueChange={setVisitNotes}
            fullWidth
            classNames={{ inputWrapper: "border-[#E3E8EF] dark:border-[#1E3A5F] bg-white dark:bg-[#0D1B2E]/50 rounded-md" }}
          />
        </div>
        <p className="text-xs text-[#697386] dark:text-[#7B93AE] mt-2">
          Total Visits: {Number(dashboard?.summary?.visit_count || 0)}
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-[#0F2240] border border-[#E3E8EF] dark:border-[#1E3A5F] rounded-xl shadow-sm px-3 pt-1">
        <Tabs
          selectedKey={String(tab)}
          onSelectionChange={(k) => setTab(Number(k))}
          variant="underlined"
          classNames={{
            tabList: "w-full border-b-0",
            tab: "text-sm font-medium text-[#697386] data-[selected=true]:text-[#635BFF]",
            cursor: "bg-[#635BFF]",
          }}
        >
          <Tab key="0" title="BOM" />
          <Tab key="1" title="Deliveries" />
          <Tab key="2" title="Activity" />
        </Tabs>
      </div>

      {/* BOM Tab */}
      {tab === 0 && (
        <div className="space-y-4">
          {grouped.map(([floor, rows]) => (
            <div key={floor}>
              <p className="text-sm font-bold text-[#0A2540] dark:text-[#C9D7E8] mb-2">Floor: {floor}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {rows.map((row) => {
                  const balance = Number(row.quantity) - Number(row.delivered_quantity);
                  return (
                    <div key={row.id} className="bg-white dark:bg-[#0F2240] border border-[#E3E8EF] dark:border-[#1E3A5F] rounded-xl shadow-sm p-4">
                      <p className="text-sm font-semibold text-[#1A1F36] dark:text-[#C9D7E8]">{row.brand_name} {row.model_number}</p>
                      <p className="text-xs text-[#697386] dark:text-[#7B93AE]">{row.product_type_name}</p>
                      <p className="text-xs text-[#697386] dark:text-[#7B93AE]">Location: {row.location_description || "-"}</p>
                      <div className="flex flex-wrap gap-1.5 mt-2 mb-3">
                        <Chip size="sm" variant="flat" classNames={{ base: "h-5", content: "text-xs px-1" }}>Approved {row.quantity}</Chip>
                        <Chip size="sm" variant="flat" color="success" classNames={{ base: "h-5", content: "text-xs px-1" }}>Delivered {row.delivered_quantity}</Chip>
                        <Chip size="sm" variant="flat" color="warning" classNames={{ base: "h-5", content: "text-xs px-1" }}>Balance {balance}</Chip>
                      </div>
                      <Select
                        size="sm"
                        variant="bordered"
                        label="Status"
                        selectedKeys={row.status ? [row.status] : []}
                        onChange={(e) => updateStatus(row.id, e.target.value)}
                        classNames={{ trigger: "border-[#E3E8EF] dark:border-[#1E3A5F] bg-white dark:bg-[#0D1B2E]/50 rounded-md h-9" }}
                      >
                        {statuses.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </Select>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Deliveries Tab */}
      {tab === 1 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {(dashboard?.bom || []).map((row) => (
            <div key={row.id} className="bg-white dark:bg-[#0F2240] border border-[#E3E8EF] dark:border-[#1E3A5F] rounded-xl shadow-sm p-4">
              <p className="text-sm font-semibold text-[#1A1F36] dark:text-[#C9D7E8] mb-2">{row.brand_name} {row.model_number}</p>
              <div className="flex flex-col md:flex-row gap-2">
                <Input
                  size="sm"
                  variant="bordered"
                  type="number"
                  label="Qty"
                  value={deliveryQty[row.item_id] || ""}
                  onChange={(e) => setDeliveryQty((prev) => ({ ...prev, [row.item_id]: e.target.value }))}
                  classNames={{ inputWrapper: "border-[#E3E8EF] dark:border-[#1E3A5F] bg-white dark:bg-[#0D1B2E]/50 rounded-md w-24" }}
                />
                <Input
                  size="sm"
                  variant="bordered"
                  label="Note"
                  value={deliveryNotes[row.item_id] || ""}
                  onChange={(e) => setDeliveryNotes((prev) => ({ ...prev, [row.item_id]: e.target.value }))}
                  classNames={{ inputWrapper: "border-[#E3E8EF] dark:border-[#1E3A5F] bg-white dark:bg-[#0D1B2E]/50 rounded-md flex-1" }}
                />
                <label className="cursor-pointer inline-flex items-center justify-center gap-1 px-3 py-1.5 text-xs border border-[#E3E8EF] dark:border-[#1E3A5F] rounded-lg bg-white dark:bg-[#0D1B2E]/50 hover:border-[#635BFF] transition-colors whitespace-nowrap text-[#1A1F36] dark:text-[#C9D7E8] w-full md:w-auto">
                  {deliveryPhotoFile[row.item_id] ? "✓ Photo" : "Photo"}
                  <input
                    hidden
                    type="file"
                    accept="image/*"
                    onChange={(e) => setDeliveryPhotoFile((prev) => ({ ...prev, [row.item_id]: e.target.files?.[0] || null }))}
                  />
                </label>
                <Button color="primary" size="sm" className="w-full md:w-auto" onPress={() => logDelivery(row.item_id)}>
                  Log
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Activity Tab */}
      {tab === 2 && (
        <div className="space-y-2">
          {conflicts.length > 0 && (
            <div className="bg-white dark:bg-[#0F2240] border border-[#B7791F]/40 rounded-xl shadow-sm p-4">
              <div className="flex items-center gap-2 mb-3 text-[#B7791F]">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-semibold">Conflicts detected: {conflicts.length}</span>
              </div>
              <div className="space-y-2">
                {conflicts.slice(0, 5).map((c, idx) => (
                  <div key={`${c.type}-${c.queuedAt}-${idx}`} className="flex flex-col md:flex-row md:items-center justify-between gap-2 p-2.5 bg-[#F6F9FC] dark:bg-[#162B47] rounded-lg">
                    <span className="text-xs text-[#697386] dark:text-[#7B93AE]">
                      {c.type.toUpperCase()} | {c.reason || "Conflict"} | {new Date(c.queuedAt).toLocaleString()}
                    </span>
                    <div className="flex gap-2">
                      <Button size="sm" variant="bordered" className="border-[#E3E8EF] dark:border-[#1E3A5F] h-7 text-xs" onPress={() => retryConflict(c, idx)}>Retry</Button>
                      <Button size="sm" color="danger" variant="flat" className="h-7 text-xs" onPress={() => discardConflict(idx)}>Discard</Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activity.slice(0, 30).map((a) => (
            <div key={a.id} className="bg-white dark:bg-[#0F2240] border border-[#E3E8EF] dark:border-[#1E3A5F] rounded-lg p-3">
              <p className="text-sm font-semibold text-[#1A1F36] dark:text-[#C9D7E8]">{a.action_type}</p>
              <p className="text-xs text-[#697386] dark:text-[#7B93AE]">
                {new Date(a.created_at).toLocaleString()} {a.user_name ? `| ${a.user_name}` : ""}
              </p>
            </div>
          ))}

          {visits.slice(0, 5).map((v) => (
            <p key={v.id} className="text-xs text-[#697386] dark:text-[#7B93AE] pl-2 border-l-2 border-[#635BFF]/30">
              Visit | {new Date(v.created_at).toLocaleString()} | {v.engineer_name || "Engineer"} | {v.notes || "-"}
            </p>
          ))}
        </div>
      )}

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
