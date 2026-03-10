import { Router } from "express";
import { z } from "zod";
import { pool, withTransaction } from "../db/pool.js";
import { asyncHandler } from "../services/asyncHandler.js";
import { validate } from "../services/validation.js";
import { requireRoles } from "../middleware/auth.js";
import { logActivity } from "../services/activity.js";

const router = Router();

async function assertCrProjectAccess(ctx, projectId) {
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
    where += ` AND p.created_by = $${params.length}`;
  }
  const { rowCount } = await pool.query(`SELECT 1 FROM projects p WHERE ${where}`, params);
  if (!rowCount) {
    const err = new Error("Project not found or access denied");
    err.status = 404;
    throw err;
  }
}

router.get(
  "/projects/:projectId/change-requests",
  requireRoles("admin", "project_manager"),
  asyncHandler(async (req, res) => {
    await assertCrProjectAccess(req.ctx, req.params.projectId);
    const { rows } = await pool.query(
      `SELECT id, project_id, status, created_by, approved_by, approved_at, created_at
       FROM change_requests
       WHERE project_id = $1 AND tenant_id = $2
       ORDER BY created_at DESC`,
      [req.params.projectId, req.ctx.tenantId]
    );
    res.json(rows);
  })
);

router.post(
  "/projects/:projectId/change-requests",
  requireRoles("admin", "project_manager"),
  asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    await assertCrProjectAccess(req.ctx, projectId);
    const existing = await pool.query(
      `SELECT id FROM change_requests
       WHERE project_id = $1 AND tenant_id = $2 AND status IN ('draft','pending')
       LIMIT 1`,
      [projectId, req.ctx.tenantId]
    );
    if (existing.rowCount) {
      return res.status(409).json({ error: "Only one open change request allowed per project" });
    }

    const { rows } = await pool.query(
      `INSERT INTO change_requests (tenant_id, project_id, status, created_by)
       VALUES ($1,$2,'draft',$3)
       RETURNING *`,
      [req.ctx.tenantId, projectId, req.ctx.userId]
    );

    await pool.query(
      `INSERT INTO activity_logs (tenant_id, project_id, user_id, action_type, entity_type, entity_id, metadata_json)
       VALUES ($1,$2,$3,'CR_CREATED','change_requests',$4,$5)`,
      [req.ctx.tenantId, projectId, req.ctx.userId, rows[0].id, { status: "draft" }]
    );

    res.status(201).json(rows[0]);
  })
);

router.get(
  "/change-requests/:crId/items",
  requireRoles("admin", "project_manager"),
  asyncHandler(async (req, res) => {
    const access = await pool.query(
      `SELECT project_id FROM change_requests WHERE id = $1 AND tenant_id = $2`,
      [req.params.crId, req.ctx.tenantId]
    );
    if (!access.rowCount) return res.status(404).json({ error: "Change request not found" });
    await assertCrProjectAccess(req.ctx, access.rows[0].project_id);
    const { rows } = await pool.query(
      `SELECT cri.id, cri.item_id, cri.change_type, cri.old_quantity, cri.new_quantity, cri.floor_label, cri.location_description, cri.created_at,
              i.model_number, i.full_name
       FROM change_request_items cri
       JOIN items i ON i.id = cri.item_id
       WHERE cri.change_request_id = $1 AND cri.tenant_id = $2
       ORDER BY cri.created_at`,
      [req.params.crId, req.ctx.tenantId]
    );
    res.json(rows);
  })
);

router.get(
  "/change-requests/:crId/diff",
  requireRoles("admin", "project_manager"),
  asyncHandler(async (req, res) => {
    const crResult = await pool.query(
      `SELECT id, project_id, status
       FROM change_requests
       WHERE id = $1 AND tenant_id = $2`,
      [req.params.crId, req.ctx.tenantId]
    );
    if (!crResult.rowCount) {
      return res.status(404).json({ error: "Change request not found" });
    }
    const projectId = crResult.rows[0].project_id;
    await assertCrProjectAccess(req.ctx, projectId);

    const beforeRows = await pool.query(
      `SELECT pbi.item_id, pbi.quantity, pbi.rate, pbi.delivered_quantity, pbi.floor_label, pbi.location_description, i.model_number, i.full_name
       FROM project_bom_items pbi
       JOIN items i ON i.id = pbi.item_id
       WHERE pbi.project_id = $1`,
      [projectId]
    );

    const changes = await pool.query(
      `SELECT item_id, change_type, old_quantity, new_quantity, floor_label, location_description
       FROM change_request_items
       WHERE change_request_id = $1
       ORDER BY created_at`,
      [req.params.crId]
    );

    const beforeMap = new Map(beforeRows.rows.map((r) => [r.item_id, Number(r.quantity)]));
    const rateMap = new Map(beforeRows.rows.map((r) => [r.item_id, Number(r.rate || 0)]));
    const detailMap = new Map(beforeRows.rows.map((r) => [r.item_id, r]));

    for (const c of changes.rows) {
      const oldQty = beforeMap.get(c.item_id) ?? 0;
      if (!detailMap.has(c.item_id)) {
        const itemMeta = await pool.query(
          `SELECT id AS item_id, model_number, full_name, default_rate FROM items WHERE id = $1`,
          [c.item_id]
        );
        if (itemMeta.rowCount) {
          detailMap.set(c.item_id, { ...itemMeta.rows[0], quantity: oldQty, delivered_quantity: 0 });
          rateMap.set(c.item_id, Number(itemMeta.rows[0].default_rate || 0));
        }
      }
    }

    const diff = changes.rows.map((c) => {
      const meta = detailMap.get(c.item_id);
      const beforeQty = beforeMap.get(c.item_id) ?? 0;
      const afterQty = c.change_type === "delete" ? 0 : Number(c.new_quantity ?? 0);
      return {
        itemId: c.item_id,
        modelNumber: meta?.model_number || "",
        fullName: meta?.full_name || "",
        changeType: c.change_type,
        beforeQty,
        afterQty,
        delta: afterQty - beforeQty,
        rate: Number(rateMap.get(c.item_id) || 0),
        floorLabel: c.floor_label ?? meta?.floor_label ?? "Unassigned",
        locationDescription: c.location_description ?? meta?.location_description ?? "",
      };
    });

    const totalDeltaQty = diff.reduce((sum, d) => sum + d.delta, 0);
    const totalDeltaValue = diff.reduce((sum, d) => sum + d.delta * d.rate, 0);
    return res.json({
      crId: req.params.crId,
      status: crResult.rows[0].status,
      diff,
      summary: { totalDeltaQty, totalDeltaValue },
    });
  })
);

router.post(
  "/change-requests/:crId/items",
  requireRoles("admin", "project_manager"),
  asyncHandler(async (req, res) => {
    const payload = validate(
      z.object({
        itemId: z.string().uuid(),
        changeType: z.enum(["add", "modify", "delete"]),
        oldQuantity: z.number().nonnegative().nullable().optional(),
        newQuantity: z.number().nonnegative().nullable().optional(),
        floorLabel: z.string().max(80).optional(),
        locationDescription: z.string().max(300).optional(),
      }),
      req.body
    );

    const inserted = await withTransaction(async (client) => {
      const crQuery = await client.query(
        `SELECT id, project_id, status FROM change_requests
         WHERE id = $1 AND tenant_id = $2 FOR UPDATE`,
        [req.params.crId, req.ctx.tenantId]
      );
      if (!crQuery.rowCount) {
        const err = new Error("Change request not found");
        err.status = 404;
        throw err;
      }
      if (!["draft", "rejected"].includes(crQuery.rows[0].status)) {
        const err = new Error("Only draft/rejected CR can be edited");
        err.status = 409;
        throw err;
      }
      const projectId = crQuery.rows[0].project_id;

      const itemQuery = await client.query(
        `SELECT i.id, i.category_id, c.sequence_order
         FROM items i
         JOIN categories c ON c.id = i.category_id
         WHERE i.id = $1 AND i.tenant_id = $2`,
        [payload.itemId, req.ctx.tenantId]
      );
      if (!itemQuery.rowCount) {
        const err = new Error("Item not found");
        err.status = 404;
        throw err;
      }

      const projectCfg = await client.query(
        `SELECT category_sequence_mode
         FROM projects
         WHERE id = $1 AND tenant_id = $2`,
        [projectId, req.ctx.tenantId]
      );
      const sequenceMode = !!projectCfg.rows[0]?.category_sequence_mode;
      const currentItem = await client.query(
        `SELECT id, quantity, delivered_quantity
         FROM project_bom_items
         WHERE project_id = $1 AND item_id = $2`,
        [projectId, payload.itemId]
      );

      if (payload.changeType === "add" && currentItem.rowCount) {
        const err = new Error("Model already exists in live BOM. Use modify change type.");
        err.status = 409;
        throw err;
      }
      if (payload.changeType !== "add" && !currentItem.rowCount) {
        const err = new Error("Item does not exist in live BOM for modify/delete.");
        err.status = 409;
        throw err;
      }
      if (payload.changeType === "modify") {
        const delivered = Number(currentItem.rows[0].delivered_quantity);
        const newQty = Number(payload.newQuantity ?? 0);
        if (newQty < delivered) {
          const err = new Error("Modified quantity cannot be less than delivered quantity.");
          err.status = 409;
          throw err;
        }
      }
      if (payload.changeType === "delete") {
        const delivered = Number(currentItem.rows[0].delivered_quantity);
        if (delivered > 0) {
          const err = new Error("Cannot delete an item with delivered quantity.");
          err.status = 409;
          throw err;
        }
      }

      if (sequenceMode && payload.changeType === "add") {
        const sequence = Number(itemQuery.rows[0].sequence_order);
        if (sequence > 1) {
          const previousCategoryHasAny = await client.query(
            `WITH effective_items AS (
               SELECT pbi.item_id, pbi.quantity
               FROM project_bom_items pbi
               WHERE pbi.project_id = $1
               UNION ALL
               SELECT cri.item_id, COALESCE(cri.new_quantity, 0) AS quantity
               FROM change_request_items cri
               WHERE cri.change_request_id = $2
                 AND cri.change_type IN ('add', 'modify')
             ),
             deleted_items AS (
               SELECT cri.item_id
               FROM change_request_items cri
               WHERE cri.change_request_id = $2
                 AND cri.change_type = 'delete'
             ),
             normalized AS (
               SELECT ei.item_id, MAX(ei.quantity) AS qty
               FROM effective_items ei
               GROUP BY ei.item_id
             )
             SELECT 1
             FROM normalized n
             JOIN items i ON i.id = n.item_id
             JOIN categories c ON c.id = i.category_id
             LEFT JOIN deleted_items d ON d.item_id = n.item_id
             WHERE c.sequence_order = $3
               AND d.item_id IS NULL
               AND n.qty > 0
             LIMIT 1`,
            [projectId, req.params.crId, sequence - 1]
          );
          if (!previousCategoryHasAny.rowCount) {
            const err = new Error(
              "Category sequence mode is enabled. Complete previous category before adding this item."
            );
            err.status = 409;
            throw err;
          }
        }
      }

      const { rows } = await client.query(
        `INSERT INTO change_request_items
          (tenant_id, change_request_id, item_id, change_type, old_quantity, new_quantity, floor_label, location_description)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         RETURNING *`,
        [
          req.ctx.tenantId,
          req.params.crId,
          payload.itemId,
          payload.changeType,
          payload.oldQuantity ?? null,
          payload.newQuantity ?? null,
          payload.floorLabel?.trim() || null,
          payload.locationDescription?.trim() || null,
        ]
      );

      await logActivity(client, {
        tenantId: req.ctx.tenantId,
        projectId: crQuery.rows[0].project_id,
        userId: req.ctx.userId,
        actionType: "CR_ITEM_ADDED",
        entityType: "change_request_items",
        entityId: rows[0].id,
        metadata: payload,
      });
      return rows[0];
    });

    res.status(201).json(inserted);
  })
);

router.delete(
  "/change-requests/:crId/items/:itemId",
  requireRoles("admin", "project_manager"),
  asyncHandler(async (req, res) => {
    const deleted = await withTransaction(async (client) => {
      const cr = await client.query(
        `SELECT id, project_id, status
         FROM change_requests
         WHERE id = $1 AND tenant_id = $2
         FOR UPDATE`,
        [req.params.crId, req.ctx.tenantId]
      );
      if (!cr.rowCount) {
        const err = new Error("Change request not found");
        err.status = 404;
        throw err;
      }
      await assertCrProjectAccess(req.ctx, cr.rows[0].project_id);
      if (!["draft", "rejected"].includes(cr.rows[0].status)) {
        const err = new Error("Only draft/rejected CR can be edited");
        err.status = 409;
        throw err;
      }

      const removed = await client.query(
        `DELETE FROM change_request_items
         WHERE change_request_id = $1 AND item_id = $2 AND tenant_id = $3
         RETURNING id`,
        [req.params.crId, req.params.itemId, req.ctx.tenantId]
      );
      if (!removed.rowCount) {
        const err = new Error("CR item not found");
        err.status = 404;
        throw err;
      }
      await logActivity(client, {
        tenantId: req.ctx.tenantId,
        projectId: cr.rows[0].project_id,
        userId: req.ctx.userId,
        actionType: "CR_ITEM_REMOVED",
        entityType: "change_request_items",
        entityId: removed.rows[0].id,
        metadata: { itemId: req.params.itemId },
      });
      return removed.rows[0];
    });
    res.json(deleted);
  })
);

router.post(
  "/change-requests/:crId/submit",
  requireRoles("admin", "project_manager"),
  asyncHandler(async (req, res) => {
    const payload = validate(
      z.object({
        rowVersion: z.number().int().positive().optional(),
      }),
      req.body || {}
    );
    const cr = await pool.query(`SELECT project_id FROM change_requests WHERE id = $1 AND tenant_id = $2`, [
      req.params.crId,
      req.ctx.tenantId,
    ]);
    if (!cr.rowCount) return res.status(404).json({ error: "Change request not found" });
    await assertCrProjectAccess(req.ctx, cr.rows[0].project_id);
    const params = [req.params.crId, req.ctx.tenantId];
    let versionWhere = "";
    if (payload.rowVersion) {
      params.push(payload.rowVersion);
      versionWhere = ` AND row_version = $${params.length}`;
    }
    const { rows } = await pool.query(
      `UPDATE change_requests
       SET status = 'pending', row_version = row_version + 1
       WHERE id = $1 AND tenant_id = $2 AND status IN ('draft','rejected')
       ${versionWhere}
       RETURNING *`,
      params
    );
    if (!rows.length) {
      return res.status(409).json({ error: "CR cannot be submitted in current state or it was modified" });
    }
    await pool.query(
      `INSERT INTO activity_logs (tenant_id, project_id, user_id, action_type, entity_type, entity_id, metadata_json)
       VALUES ($1,$2,$3,'CR_SUBMITTED','change_requests',$4,$5)`,
      [req.ctx.tenantId, rows[0].project_id, req.ctx.userId, rows[0].id, { status: "pending" }]
    );
    res.json(rows[0]);
  })
);

router.post(
  "/change-requests/:crId/reject",
  requireRoles("admin", "project_manager"),
  asyncHandler(async (req, res) => {
    const payload = validate(
      z.object({
        rowVersion: z.number().int().positive().optional(),
      }),
      req.body || {}
    );
    const cr = await pool.query(`SELECT project_id FROM change_requests WHERE id = $1 AND tenant_id = $2`, [
      req.params.crId,
      req.ctx.tenantId,
    ]);
    if (!cr.rowCount) return res.status(404).json({ error: "Change request not found" });
    await assertCrProjectAccess(req.ctx, cr.rows[0].project_id);
    const params = [req.params.crId, req.ctx.tenantId];
    let versionWhere = "";
    if (payload.rowVersion) {
      params.push(payload.rowVersion);
      versionWhere = ` AND row_version = $${params.length}`;
    }
    const { rows } = await pool.query(
      `UPDATE change_requests
       SET status = 'rejected', row_version = row_version + 1
       WHERE id = $1 AND tenant_id = $2 AND status = 'pending'
       ${versionWhere}
       RETURNING *`,
      params
    );
    if (!rows.length) {
      return res.status(409).json({ error: "Only pending CR can be rejected" });
    }
    await pool.query(
      `INSERT INTO activity_logs (tenant_id, project_id, user_id, action_type, entity_type, entity_id, metadata_json)
       VALUES ($1,$2,$3,'CR_REJECTED','change_requests',$4,$5)`,
      [req.ctx.tenantId, rows[0].project_id, req.ctx.userId, rows[0].id, { status: "rejected" }]
    );
    res.json(rows[0]);
  })
);

router.post(
  "/change-requests/:crId/approve",
  requireRoles("admin", "project_manager"),
  asyncHandler(async (req, res) => {
    const payload = validate(
      z.object({
        rowVersion: z.number().int().positive().optional(),
      }),
      req.body || {}
    );
    const cr = await pool.query(`SELECT project_id FROM change_requests WHERE id = $1 AND tenant_id = $2`, [
      req.params.crId,
      req.ctx.tenantId,
    ]);
    if (!cr.rowCount) return res.status(404).json({ error: "Change request not found" });
    await assertCrProjectAccess(req.ctx, cr.rows[0].project_id);
    const result = await withTransaction(async (client) => {
      const crQuery = await client.query(
        `SELECT * FROM change_requests
         WHERE id = $1 AND tenant_id = $2
         FOR UPDATE`,
        [req.params.crId, req.ctx.tenantId]
      );
      if (!crQuery.rowCount) {
        const err = new Error("CR not found");
        err.status = 404;
        throw err;
      }
      const cr = crQuery.rows[0];
      if (cr.status !== "pending") {
        const err = new Error("Only pending CR can be approved");
        err.status = 409;
        throw err;
      }
      if (payload.rowVersion && Number(cr.row_version) !== Number(payload.rowVersion)) {
        const err = new Error("CR has been modified by another user");
        err.status = 409;
        throw err;
      }

      const changes = await client.query(
        `SELECT id, item_id, change_type, old_quantity, new_quantity, floor_label, location_description
         FROM change_request_items
         WHERE change_request_id = $1
         ORDER BY created_at`,
        [cr.id]
      );

      for (const change of changes.rows) {
        if (change.change_type === "add") {
          await client.query(
            `INSERT INTO project_bom_items
              (tenant_id, project_id, item_id, quantity, rate, delivered_quantity, floor_label, location_description, status, updated_by)
             VALUES ($1,$2,$3,$4,
              COALESCE((SELECT default_rate FROM items WHERE id = $3), 0),
              0, COALESCE($6, 'Unassigned'), $7, 'Work Yet to Start', $5)
             ON CONFLICT (project_id, item_id)
             DO UPDATE SET quantity = EXCLUDED.quantity, floor_label = COALESCE(EXCLUDED.floor_label, project_bom_items.floor_label), location_description = COALESCE(EXCLUDED.location_description, project_bom_items.location_description), updated_by = EXCLUDED.updated_by, updated_at = now(), row_version = project_bom_items.row_version + 1`,
            [req.ctx.tenantId, cr.project_id, change.item_id, change.new_quantity ?? 0, req.ctx.userId, change.floor_label ?? null, change.location_description ?? null]
          );
        } else if (change.change_type === "modify") {
          await client.query(
            `UPDATE project_bom_items
             SET quantity = $1,
                 floor_label = COALESCE($5, floor_label),
                 location_description = COALESCE($6, location_description),
                 updated_by = $2, updated_at = now(), row_version = row_version + 1
             WHERE project_id = $3 AND item_id = $4`,
            [change.new_quantity ?? 0, req.ctx.userId, cr.project_id, change.item_id, change.floor_label ?? null, change.location_description ?? null]
          );
        } else if (change.change_type === "delete") {
          await client.query(
            `DELETE FROM project_bom_items WHERE project_id = $1 AND item_id = $2`,
            [cr.project_id, change.item_id]
          );
        }
      }

      const approved = await client.query(
        `UPDATE change_requests
         SET status = 'approved', approved_by = $1, approved_at = now(), row_version = row_version + 1
         WHERE id = $2
         RETURNING *`,
        [req.ctx.userId, cr.id]
      );

      await logActivity(client, {
        tenantId: req.ctx.tenantId,
        projectId: cr.project_id,
        userId: req.ctx.userId,
        actionType: "CR_APPROVED",
        entityType: "change_requests",
        entityId: cr.id,
        metadata: { itemChangeCount: changes.rowCount },
      });

      return approved.rows[0];
    });

    res.json(result);
  })
);

router.delete(
  "/change-requests/:crId",
  requireRoles("admin", "project_manager"),
  asyncHandler(async (req, res) => {
    await withTransaction(async (client) => {
      const cr = await client.query(
        `SELECT id, project_id, status
         FROM change_requests
         WHERE id = $1 AND tenant_id = $2
         FOR UPDATE`,
        [req.params.crId, req.ctx.tenantId]
      );
      if (!cr.rowCount) {
        const err = new Error("Change request not found");
        err.status = 404;
        throw err;
      }
      await assertCrProjectAccess(req.ctx, cr.rows[0].project_id);
      if (!["draft", "rejected"].includes(cr.rows[0].status)) {
        const err = new Error("Only draft/rejected CR can be deleted");
        err.status = 409;
        throw err;
      }
      await client.query(`DELETE FROM change_requests WHERE id = $1 AND tenant_id = $2`, [
        req.params.crId,
        req.ctx.tenantId,
      ]);
      await logActivity(client, {
        tenantId: req.ctx.tenantId,
        projectId: cr.rows[0].project_id,
        userId: req.ctx.userId,
        actionType: "CR_DELETED",
        entityType: "change_requests",
        entityId: req.params.crId,
        metadata: {},
      });
    });
    res.status(204).send();
  })
);

export default router;
