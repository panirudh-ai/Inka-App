import { Router } from "express";
import PDFDocument from "pdfkit";
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

    const summary = await pool.query(
      `SELECT
          COALESCE(SUM(quantity * rate), 0) AS total_scope_value,
          COALESCE(SUM(delivered_quantity * rate), 0) AS total_delivered_value,
          COALESCE(SUM((quantity - delivered_quantity) * rate), 0) AS total_balance_value
       FROM project_bom_items
       WHERE project_id = $1`,
      [projectId]
    );
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
    const s = summary.rows[0];
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

    doc.fontSize(13).text("Financial Summary");
    doc.fontSize(10);
    doc.text(`Scope Value: INR ${Number(s.total_scope_value || 0).toLocaleString()}`);
    doc.text(`Delivered Value: INR ${Number(s.total_delivered_value || 0).toLocaleString()}`);
    doc.text(`Balance Value: INR ${Number(s.total_balance_value || 0).toLocaleString()}`);
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

export default router;
