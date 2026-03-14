import { useEffect, useMemo, useState } from "react";
import { Button, Chip, Select, SelectItem } from "@heroui/react";
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
    <div>
      {/* Header Card */}
      <div className="bg-white dark:bg-[#0F2240] border border-[#E3E8EF] dark:border-[#1E3A5F] rounded-xl shadow-sm p-4 mb-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <h2 className="text-base font-semibold text-[#1A1F36] dark:text-[#C9D7E8]">Client Portal (Read Only)</h2>
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <Select
              size="sm"
              variant="bordered"
              label="Project"
              selectedKeys={projectId ? [String(projectId)] : []}
              onChange={(e) => setProjectId(e.target.value)}
              classNames={{
                trigger: "border-[#E3E8EF] dark:border-[#1E3A5F] bg-white dark:bg-[#0D1B2E]/50 rounded-md h-9 min-w-[260px]",
              }}
            >
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </Select>
            <Button
              variant="bordered"
              size="sm"
              className="w-full sm:w-auto border-[#E3E8EF] dark:border-[#1E3A5F] text-[#1A1F36] dark:text-[#C9D7E8]"
              onPress={async () => {
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
          </div>
        </div>
        {projects.length === 0 ? (
          <p className="text-xs text-[#697386] dark:text-[#7B93AE] mt-2">
            No projects are mapped to this client account yet.
          </p>
        ) : null}
      </div>

      {/* Project Info Card */}
      {dashboard?.project ? (
        <div className="bg-white dark:bg-[#0F2240] border border-[#E3E8EF] dark:border-[#1E3A5F] rounded-xl shadow-sm p-4 mb-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <div>
              <p className="text-xs text-[#697386] dark:text-[#7B93AE]">Project</p>
              <p className="text-sm text-[#1A1F36] dark:text-[#C9D7E8]">{dashboard.project.name}</p>
            </div>
            <div>
              <p className="text-xs text-[#697386] dark:text-[#7B93AE]">Client</p>
              <p className="text-sm text-[#1A1F36] dark:text-[#C9D7E8]">{dashboard.project.client_name}</p>
            </div>
            <div>
              <p className="text-xs text-[#697386] dark:text-[#7B93AE]">Location</p>
              <p className="text-sm text-[#1A1F36] dark:text-[#C9D7E8]">{dashboard.project.location}</p>
            </div>
            <div>
              <p className="text-xs text-[#697386] dark:text-[#7B93AE]">Status</p>
              <p className="text-sm text-[#1A1F36] dark:text-[#C9D7E8]">{dashboard.project.status}</p>
            </div>
          </div>
          {dashboard.project.drive_link ? (
            <Button
              size="sm"
              variant="bordered"
              className="mt-2 border-[#E3E8EF] dark:border-[#1E3A5F] text-[#1A1F36] dark:text-[#C9D7E8]"
              onPress={() => window.open(dashboard.project.drive_link, "_blank", "noopener,noreferrer")}
            >
              Open Drive Link
            </Button>
          ) : null}
          {driveFiles.length ? (
            <div className="mt-2 flex flex-col gap-1">
              <p className="text-xs text-[#697386] dark:text-[#7B93AE]">Drive Files</p>
              {driveFiles.slice(0, 8).map((f) => (
                <Button
                  key={f.id}
                  size="sm"
                  variant="light"
                  className="justify-start text-[#635BFF] hover:text-[#635BFF]/80 px-0"
                  onPress={() => window.open(f.webViewLink || f.webContentLink, "_blank", "noopener,noreferrer")}
                >
                  {f.name}
                </Button>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        {/* BOM Section */}
        <div className="md:col-span-8">
          <div className="bg-white dark:bg-[#0F2240] border border-[#E3E8EF] dark:border-[#1E3A5F] rounded-xl shadow-sm p-4">
            <h3 className="text-sm font-bold text-[#1A1F36] dark:text-[#C9D7E8] mb-2">Approved BOM by System</h3>
            {grouped.map(([floor, rows]) => (
              <div key={floor} className="mt-2">
                <p className="text-sm font-semibold text-[#1A1F36] dark:text-[#C9D7E8]">Floor: {floor}</p>
                <div className="flex flex-col gap-2 mt-1">
                  {rows.map((r) => (
                    <div
                      key={r.id}
                      className="bg-[#F6F9FC] dark:bg-[#162B47] border border-[#E3E8EF] dark:border-[#1E3A5F] rounded-lg p-2"
                    >
                      <p className="text-sm text-[#1A1F36] dark:text-[#C9D7E8]">{r.brand_name} {r.model_number}</p>
                      <p className="text-xs text-[#697386] dark:text-[#7B93AE]">Location: {r.location_description || "-"}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        <Chip size="sm" variant="flat" color="default">Approved {r.quantity}</Chip>
                        <Chip size="sm" variant="flat" color="success">Delivered {r.delivered_quantity}</Chip>
                        <Chip size="sm" variant="flat" color="warning">Balance {Number(r.quantity) - Number(r.delivered_quantity)}</Chip>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column */}
        <div className="md:col-span-4 flex flex-col gap-3">
          {/* Delivery Progress */}
          <div className="bg-white dark:bg-[#0F2240] border border-[#E3E8EF] dark:border-[#1E3A5F] rounded-xl shadow-sm p-4">
            <h4 className="text-sm font-semibold text-[#1A1F36] dark:text-[#C9D7E8] mb-1">Delivery Progress</h4>
            <p className="text-sm text-[#1A1F36] dark:text-[#C9D7E8]">Scope: INR {Number(dashboard?.summary?.total_scope_value || 0).toLocaleString()}</p>
            <p className="text-sm text-[#1A1F36] dark:text-[#C9D7E8]">Delivered: INR {Number(dashboard?.summary?.total_delivered_value || 0).toLocaleString()}</p>
            <p className="text-sm text-[#1A1F36] dark:text-[#C9D7E8]">Balance: INR {Number(dashboard?.summary?.total_balance_value || 0).toLocaleString()}</p>
          </div>

          {/* Recent Activity */}
          <div className="bg-white dark:bg-[#0F2240] border border-[#E3E8EF] dark:border-[#1E3A5F] rounded-xl shadow-sm p-4">
            <h4 className="text-sm font-semibold text-[#1A1F36] dark:text-[#C9D7E8] mb-2">Recent Activity</h4>
            <div className="flex flex-col gap-1">
              {activity.slice(0, 8).map((a) => (
                <p key={a.id} className="text-xs text-[#697386] dark:text-[#7B93AE]">
                  {a.action_type} | {new Date(a.created_at).toLocaleString()}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Deliveries */}
      <div className="bg-white dark:bg-[#0F2240] border border-[#E3E8EF] dark:border-[#1E3A5F] rounded-xl shadow-sm p-4 mt-3">
        <h4 className="text-sm font-semibold text-[#1A1F36] dark:text-[#C9D7E8] mb-2">Deliveries</h4>
        <div className="flex flex-col gap-1">
          {deliveries.slice(0, 10).map((d) => (
            <p key={d.id} className="text-xs text-[#697386] dark:text-[#7B93AE]">
              {d.full_name} | Qty {d.quantity} | {d.engineer_name || "Engineer"} | {new Date(d.created_at).toLocaleString()}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
