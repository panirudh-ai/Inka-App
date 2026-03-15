import { Router } from "express";
import PDFDocument from "pdfkit";
import * as XLSX from "xlsx";
import { pool } from "../db/pool.js";
import { asyncHandler } from "../services/asyncHandler.js";
import { requireRoles } from "../middleware/auth.js";

const router = Router();

async function assertReportProjectAccess(ctx, projectId) {
  const params = [projectId, ctx.tenantId];
  let where = "p.id = $1 AND p.tenant_id = $2";
  if (ctx.role === "engineer") {
    params.push(ctx.userId);
    where += ` AND EXISTS (
      SELECT 1 FROM project_engineers pe
      WHERE pe.project_id = p.id AND pe.user_id = $${params.length}
    )`;
  } else if (ctx.role === "client") {
    params.push(ctx.userId);
    where += ` AND (
      p.created_by = $${params.length}
      OR EXISTS (
        SELECT 1 FROM project_clients pc
        WHERE pc.project_id = p.id AND pc.user_id = $${params.length}
      )
    )`;
  }
  const { rowCount } = await pool.query(`SELECT 1 FROM projects p WHERE ${where}`, params);
  if (!rowCount) {
    const err = new Error("Project not found or access denied");
    err.status = 404;
    throw err;
  }
}

router.get(
  "/projects/:projectId/report.pdf",
  requireRoles("admin", "project_manager", "engineer", "client"),
  asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    await assertReportProjectAccess(req.ctx, projectId);
    const project = await pool.query(
      `SELECT id, name, client_name, location, drive_link, status
       FROM projects
       WHERE id = $1 AND tenant_id = $2`,
      [projectId, req.ctx.tenantId]
    );
    if (!project.rowCount) return res.status(404).json({ error: "Project not found" });

    const bom = await pool.query(
      `SELECT c.name AS category_name, pt.name AS product_type_name, b.name AS brand_name,
              i.model_number, pbi.quantity, pbi.delivered_quantity, pbi.status
       FROM project_bom_items pbi
       JOIN items i ON i.id = pbi.item_id
       JOIN categories c ON c.id = i.category_id
       JOIN product_types pt ON pt.id = i.product_type_id
       JOIN brands b ON b.id = i.brand_id
       WHERE pbi.project_id = $1
       ORDER BY c.sequence_order, pt.name, b.name, i.model_number`,
      [projectId]
    );
    const deliveries = await pool.query(
      `SELECT d.created_at, i.full_name, d.quantity, d.notes, u.name AS engineer_name
       FROM deliveries d
       JOIN items i ON i.id = d.item_id
       LEFT JOIN users u ON u.id = d.logged_by
       WHERE d.project_id = $1
       ORDER BY d.created_at DESC
       LIMIT 20`,
      [projectId]
    );

    const p = project.rows[0];
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="inka_report_${projectId}.pdf"`);

    const doc = new PDFDocument({ margin: 42, size: "A4" });
    doc.pipe(res);

    doc.fontSize(18).text("INKA Project Report", { underline: true });
    doc.moveDown(0.4);
    doc.fontSize(11).text(`Project: ${p.name}`);
    doc.text(`Client: ${p.client_name}`);
    doc.text(`Location: ${p.location}`);
    if (p.drive_link) {
      doc.text(`Drive Link: ${p.drive_link}`);
    }
    doc.text(`Status: ${p.status}`);
    doc.moveDown(0.7);

    doc.fontSize(13).text("Approved BOM");
    doc.fontSize(9);
    for (const row of bom.rows.slice(0, 80)) {
      const line = `${row.category_name} | ${row.product_type_name} | ${row.brand_name} ${row.model_number} | A:${row.quantity} D:${row.delivered_quantity} | ${row.status}`;
      doc.text(line);
    }
    doc.moveDown(0.7);

    doc.fontSize(13).text("Recent Deliveries");
    doc.fontSize(9);
    for (const d of deliveries.rows) {
      doc.text(
        `${new Date(d.created_at).toLocaleString()} | ${d.full_name} | Qty ${d.quantity} | ${d.engineer_name || "Engineer"} | ${d.notes || "-"}`
      );
    }

    doc.end();
  })
);

router.get(
  "/projects/:projectId/report.xlsx",
  requireRoles("admin", "project_manager", "engineer", "client"),
  asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    await assertReportProjectAccess(req.ctx, projectId);

    const project = await pool.query(
      `SELECT id, name, client_name, location, drive_link, status
       FROM projects WHERE id = $1 AND tenant_id = $2`,
      [projectId, req.ctx.tenantId]
    );
    if (!project.rowCount) return res.status(404).json({ error: "Project not found" });

    const bom = await pool.query(
      `SELECT c.name AS category, pt.name AS product_type, b.name AS brand,
              i.model_number, pbi.quantity AS approved_qty, pbi.delivered_quantity AS delivered_qty, pbi.status
       FROM project_bom_items pbi
       JOIN items i ON i.id = pbi.item_id
       JOIN categories c ON c.id = i.category_id
       JOIN product_types pt ON pt.id = i.product_type_id
       JOIN brands b ON b.id = i.brand_id
       WHERE pbi.project_id = $1
       ORDER BY c.sequence_order, pt.name, b.name, i.model_number`,
      [projectId]
    );

    const deliveries = await pool.query(
      `SELECT TO_CHAR(d.created_at AT TIME ZONE 'Asia/Kolkata', 'DD-Mon-YYYY HH12:MI AM') AS date,
              i.full_name AS item, d.quantity, u.name AS logged_by, d.notes
       FROM deliveries d
       JOIN items i ON i.id = d.item_id
       LEFT JOIN users u ON u.id = d.logged_by
       WHERE d.project_id = $1
       ORDER BY d.created_at DESC
       LIMIT 200`,
      [projectId]
    );

    const p = project.rows[0];
    const wb = XLSX.utils.book_new();

    // ── Sheet 1: Project Info ──────────────────────────────────────────
    const infoData = [
      ["Field", "Value"],
      ["Project Name", p.name],
      ["Client", p.client_name],
      ["Location", p.location],
      ["Status", p.status],
      ["Drive Link", p.drive_link || ""],
    ];
    const wsInfo = XLSX.utils.aoa_to_sheet(infoData);
    wsInfo["!cols"] = [{ wch: 18 }, { wch: 40 }];
    XLSX.utils.book_append_sheet(wb, wsInfo, "Project Info");

    // ── Sheet 2: Approved BOM ──────────────────────────────────────────
    const bomHeader = ["Category", "Product Type", "Brand", "Model Number", "Approved Qty", "Delivered Qty", "Status"];
    const bomRows = bom.rows.map((r) => [
      r.category, r.product_type, r.brand, r.model_number,
      r.approved_qty, r.delivered_qty, r.status,
    ]);
    const wsBom = XLSX.utils.aoa_to_sheet([bomHeader, ...bomRows]);
    wsBom["!cols"] = [{ wch: 20 }, { wch: 20 }, { wch: 18 }, { wch: 20 }, { wch: 12 }, { wch: 14 }, { wch: 14 }];
    XLSX.utils.book_append_sheet(wb, wsBom, "Approved BOM");

    // ── Sheet 3: Deliveries ────────────────────────────────────────────
    const delHeader = ["Date", "Item", "Quantity", "Logged By", "Notes"];
    const delRows = deliveries.rows.map((d) => [d.date, d.item, d.quantity, d.logged_by || "", d.notes || ""]);
    const wsDel = XLSX.utils.aoa_to_sheet([delHeader, ...delRows]);
    wsDel["!cols"] = [{ wch: 22 }, { wch: 36 }, { wch: 10 }, { wch: 20 }, { wch: 36 }];
    XLSX.utils.book_append_sheet(wb, wsDel, "Deliveries");

    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="inka_report_${projectId}.xlsx"`);
    res.send(buffer);
  })
);

export default router;
