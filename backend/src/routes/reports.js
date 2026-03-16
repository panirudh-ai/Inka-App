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

// ---------------------------------------------------------------------------
// Helper — truncate text to fit a cell width (approximate char-based)
// ---------------------------------------------------------------------------
function truncateText(doc, text, maxWidth) {
  if (!text) return "";
  const str = String(text);
  if (doc.widthOfString(str) <= maxWidth) return str;
  let truncated = str;
  while (truncated.length > 0 && doc.widthOfString(truncated + "…") > maxWidth) {
    truncated = truncated.slice(0, -1);
  }
  return truncated + "…";
}

// ---------------------------------------------------------------------------
// Helper — draw a bordered table, returns the Y position after the table
// ---------------------------------------------------------------------------
function drawTable(doc, { x, y, headers, rows, colWidths, rowHeight = 20, headerColor = "#dc5648" }) {
  const totalWidth = colWidths.reduce((a, b) => a + b, 0);
  const pageBottom = doc.page.height - doc.page.margins.bottom;
  const cellPaddingX = 5;
  const cellPaddingY = 5;

  // ── Draw header row ──────────────────────────────────────────────────────
  doc.rect(x, y, totalWidth, rowHeight).fill(headerColor);
  doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(7);

  let cx = x;
  for (let i = 0; i < headers.length; i++) {
    const label = truncateText(doc, headers[i], colWidths[i] - cellPaddingX * 2);
    doc.text(label, cx + cellPaddingX, y + cellPaddingY, {
      width: colWidths[i] - cellPaddingX * 2,
      lineBreak: false,
    });
    cx += colWidths[i];
  }

  // Header border
  doc.strokeColor("#e0e0e0").lineWidth(0.5);
  cx = x;
  for (let i = 0; i < headers.length; i++) {
    doc.rect(cx, y, colWidths[i], rowHeight).stroke();
    cx += colWidths[i];
  }

  let currentY = y + rowHeight;

  // ── Draw data rows ───────────────────────────────────────────────────────
  for (let r = 0; r < rows.length; r++) {
    // Page break check
    if (currentY + rowHeight > pageBottom) {
      doc.addPage();
      currentY = doc.page.margins.top;

      // Redraw header on new page
      doc.rect(x, currentY, totalWidth, rowHeight).fill(headerColor);
      doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(7);
      cx = x;
      for (let i = 0; i < headers.length; i++) {
        const label = truncateText(doc, headers[i], colWidths[i] - cellPaddingX * 2);
        doc.text(label, cx + cellPaddingX, currentY + cellPaddingY, {
          width: colWidths[i] - cellPaddingX * 2,
          lineBreak: false,
        });
        cx += colWidths[i];
      }
      doc.strokeColor("#e0e0e0").lineWidth(0.5);
      cx = x;
      for (let i = 0; i < headers.length; i++) {
        doc.rect(cx, currentY, colWidths[i], rowHeight).stroke();
        cx += colWidths[i];
      }
      currentY += rowHeight;
    }

    const rowBg = r % 2 === 0 ? "#f5f5f5" : "#ffffff";
    doc.rect(x, currentY, totalWidth, rowHeight).fill(rowBg);

    doc.fillColor("#333333").font("Helvetica").fontSize(7);
    cx = x;
    const rowData = rows[r];
    for (let i = 0; i < colWidths.length; i++) {
      const cellText = truncateText(doc, rowData[i] ?? "", colWidths[i] - cellPaddingX * 2);
      doc.text(cellText, cx + cellPaddingX, currentY + cellPaddingY, {
        width: colWidths[i] - cellPaddingX * 2,
        lineBreak: false,
      });
      cx += colWidths[i];
    }

    // Row borders
    doc.strokeColor("#e0e0e0").lineWidth(0.5);
    cx = x;
    for (let i = 0; i < colWidths.length; i++) {
      doc.rect(cx, currentY, colWidths[i], rowHeight).stroke();
      cx += colWidths[i];
    }

    currentY += rowHeight;
  }

  return currentY;
}

// ---------------------------------------------------------------------------
// Helper — draw a section heading with a left accent bar
// ---------------------------------------------------------------------------
function drawSectionHeading(doc, text, x, y) {
  doc.rect(x, y, 3, 14).fill("#dc5648");
  doc.fillColor("#333333").font("Helvetica-Bold").fontSize(9);
  doc.text(text, x + 9, y + 2, { characterSpacing: 0.5 });
  return y + 22;
}

// ---------------------------------------------------------------------------
// GET /projects/:projectId/report.pdf
// ---------------------------------------------------------------------------
router.get(
  "/projects/:projectId/report.pdf",
  requireRoles("admin", "project_manager", "engineer", "client"),
  asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    await assertReportProjectAccess(req.ctx, projectId);

    // ── Queries ─────────────────────────────────────────────────────────────
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

    // ── Setup document ───────────────────────────────────────────────────────
    const p = project.rows[0];
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="inka_report_${projectId}.pdf"`
    );

    const doc = new PDFDocument({ margin: 40, size: "A4" });
    doc.pipe(res);

    const margin = 40;
    const pageWidth = doc.page.width; // 595.28 for A4
    const contentWidth = pageWidth - margin * 2; // ~515
    const generatedDate = new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    // ── Section 1: Header bar ────────────────────────────────────────────────
    doc.rect(0, 0, pageWidth, 60).fill("#dc5648");

    // INKA brand text
    doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(22);
    doc.text("INKA", margin, 12, { lineBreak: false });

    // Subtitle
    doc.font("Helvetica").fontSize(10);
    doc.text("Project Report", margin, 37, { lineBreak: false });

    // Date on the right
    doc.font("Helvetica").fontSize(8);
    doc.text(`Generated: ${generatedDate}`, 0, 24, {
      align: "right",
      width: pageWidth - margin,
      lineBreak: false,
    });

    let currentY = 80;

    // ── Section 2: Project Details table ────────────────────────────────────
    currentY = drawSectionHeading(doc, "PROJECT DETAILS", margin, currentY);

    const infoColWidths = [130, contentWidth - 130];
    const infoHeaders = ["Field", "Value"];
    const infoRows = [
      ["Project Name", p.name || "—"],
      ["Client", p.client_name || "—"],
      ["Location", p.location || "—"],
      ["Status", p.status || "—"],
      ["Drive Link", p.drive_link || "—"],
      ["Report Generated", generatedDate],
    ];

    currentY = drawTable(doc, {
      x: margin,
      y: currentY,
      headers: infoHeaders,
      rows: infoRows,
      colWidths: infoColWidths,
      rowHeight: 18,
    });

    currentY += 18;

    // ── Section 3: BOM Summary bar ───────────────────────────────────────────
    const bomRows = bom.rows;
    const totalItems = bomRows.length;
    const deliveredItems = bomRows.filter((r) => Number(r.delivered_quantity) > 0).length;
    const balanceItems = bomRows.filter(
      (r) => Number(r.quantity) > Number(r.delivered_quantity)
    ).length;
    const installedItems = bomRows.filter(
      (r) => r.status && r.status.toLowerCase() === "installed"
    ).length;

    const stats = [
      { label: "Total Items", value: totalItems },
      { label: "Delivered", value: deliveredItems },
      { label: "Balance", value: balanceItems },
      { label: "Installed", value: installedItems },
    ];

    const boxW = Math.floor(contentWidth / stats.length) - 6;
    const boxH = 38;
    let bx = margin;

    for (const stat of stats) {
      doc.rect(bx, currentY, boxW, boxH).fill("#f0f0f0");
      doc.rect(bx, currentY, boxW, 3).fill("#dc5648");
      doc.fillColor("#dc5648").font("Helvetica-Bold").fontSize(16);
      doc.text(String(stat.value), bx, currentY + 7, {
        width: boxW,
        align: "center",
        lineBreak: false,
      });
      doc.fillColor("#666666").font("Helvetica").fontSize(7);
      doc.text(stat.label, bx, currentY + 26, {
        width: boxW,
        align: "center",
        lineBreak: false,
      });
      bx += boxW + 8;
    }

    currentY += boxH + 18;

    // ── Section 4: Approved BOM table ────────────────────────────────────────
    if (currentY > 700) {
      doc.addPage();
      currentY = doc.page.margins.top;
    }

    currentY = drawSectionHeading(doc, "APPROVED BILL OF MATERIALS", margin, currentY);

    const bomColWidths = [80, 90, 70, 100, 55, 55, 75];
    const bomHeaders = [
      "Category",
      "Product Type",
      "Brand",
      "Model",
      "Approved Qty",
      "Delivered Qty",
      "Status",
    ];
    const bomDataRows = bomRows.map((r) => [
      r.category_name,
      r.product_type_name,
      r.brand_name,
      r.model_number,
      r.quantity,
      r.delivered_quantity,
      r.status,
    ]);

    currentY = drawTable(doc, {
      x: margin,
      y: currentY,
      headers: bomHeaders,
      rows: bomDataRows,
      colWidths: bomColWidths,
      rowHeight: 20,
    });

    currentY += 18;

    // ── Section 5: Delivery Log table ────────────────────────────────────────
    if (currentY > 700) {
      doc.addPage();
      currentY = doc.page.margins.top;
    }

    currentY = drawSectionHeading(doc, "DELIVERY LOG", margin, currentY);

    const delColWidths = [90, 160, 35, 90, 150];
    const delHeaders = ["Date", "Item", "Qty", "Logged By", "Notes"];
    const delDataRows = deliveries.rows.map((d) => [
      d.created_at ? new Date(d.created_at).toLocaleDateString("en-GB") : "—",
      d.full_name || "—",
      d.quantity ?? "—",
      d.engineer_name || "—",
      d.notes || "—",
    ]);

    currentY = drawTable(doc, {
      x: margin,
      y: currentY,
      headers: delHeaders,
      rows: delDataRows,
      colWidths: delColWidths,
      rowHeight: 20,
    });

    // ── Footer ────────────────────────────────────────────────────────────────
    const footerY = doc.page.height - 30;
    doc.rect(0, footerY - 4, pageWidth, 1).fill("#e0e0e0");
    doc.fillColor("#999999").font("Helvetica").fontSize(7);
    doc.text(
      `INKA — Confidential  |  Generated ${generatedDate}`,
      margin,
      footerY,
      { align: "left", lineBreak: false }
    );
    doc.text(`Page 1`, 0, footerY, {
      align: "right",
      width: pageWidth - margin,
      lineBreak: false,
    });

    doc.end();
  })
);

export default router;
