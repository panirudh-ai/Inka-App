import { Router } from "express";
import { z } from "zod";
import { pool, withTransaction } from "../db/pool.js";
import { asyncHandler } from "../services/asyncHandler.js";
import { validate } from "../services/validation.js";
import { requireRoles } from "../middleware/auth.js";
import { logActivity } from "../services/activity.js";
import { asPaginated, parsePagination } from "../services/pagination.js";

const router = Router();

async function assertDeliveryProjectAccess(ctx, projectId) {
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
  "/projects/:projectId/deliveries",
  requireRoles("admin", "project_manager", "engineer", "client"),
  asyncHandler(async (req, res) => {
    const pg = parsePagination(req.query, { defaultLimit: 50, maxLimit: 500 });
    await assertDeliveryProjectAccess(req.ctx, req.params.projectId);
    const countResult = await pool.query(
      `SELECT COUNT(*)::int AS total
       FROM deliveries d
       WHERE d.project_id = $1 AND d.tenant_id = $2`,
      [req.params.projectId, req.ctx.tenantId]
    );
    const values = [req.params.projectId, req.ctx.tenantId];
    let limitClause = "";
    if (pg.enabled) {
      values.push(pg.limit, pg.offset);
      limitClause = `LIMIT $${values.length - 1} OFFSET $${values.length}`;
    }
    const { rows } = await pool.query(
      `SELECT d.id, d.project_id, d.item_id, d.quantity, d.notes, d.photo_url, d.logged_by, d.created_at,
              i.model_number, i.full_name, u.name AS engineer_name
       FROM deliveries d
       JOIN items i ON i.id = d.item_id
       LEFT JOIN users u ON u.id = d.logged_by
       WHERE d.project_id = $1 AND d.tenant_id = $2
       ORDER BY d.created_at DESC
       ${limitClause}`,
      values
    );
    if (pg.enabled) return res.json(asPaginated(rows, countResult.rows[0].total, pg.page, pg.limit));
    res.json(rows);
  })
);

router.post(
  "/projects/:projectId/deliveries",
  requireRoles("admin", "project_manager", "engineer"),
  asyncHandler(async (req, res) => {
    await assertDeliveryProjectAccess(req.ctx, req.params.projectId);
    const payload = validate(
      z.object({
        itemId: z.string().uuid(),
        quantity: z.number().positive(),
        notes: z.string().max(2000).optional(),
        photoUrl: z.string().url().optional(),
      }),
      req.body
    );

    const created = await withTransaction(async (client) => {
      const lock = await client.query(
        `SELECT id, quantity, delivered_quantity
         FROM project_bom_items
         WHERE project_id = $1 AND item_id = $2
         FOR UPDATE`,
        [req.params.projectId, payload.itemId]
      );
      if (!lock.rowCount) {
        const err = new Error("Item is not part of approved BOM");
        err.status = 409;
        throw err;
      }
      const bom = lock.rows[0];
      const nextDelivered = Number(bom.delivered_quantity) + Number(payload.quantity);
      if (nextDelivered > Number(bom.quantity)) {
        const err = new Error("Delivery quantity exceeds approved balance");
        err.status = 409;
        throw err;
      }

      const inserted = await client.query(
        `INSERT INTO deliveries
          (tenant_id, project_id, item_id, quantity, notes, photo_url, logged_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7)
         RETURNING *`,
        [
          req.ctx.tenantId,
          req.params.projectId,
          payload.itemId,
          payload.quantity,
          payload.notes || null,
          payload.photoUrl || null,
          req.ctx.userId,
        ]
      );

      await client.query(
        `UPDATE project_bom_items
         SET delivered_quantity = delivered_quantity + $1, updated_at = now(), updated_by = $2, row_version = row_version + 1
         WHERE id = $3`,
        [payload.quantity, req.ctx.userId, bom.id]
      );

      await logActivity(client, {
        tenantId: req.ctx.tenantId,
        projectId: req.params.projectId,
        userId: req.ctx.userId,
        actionType: "DELIVERY_LOGGED",
        entityType: "deliveries",
        entityId: inserted.rows[0].id,
        metadata: { itemId: payload.itemId, quantity: payload.quantity },
      });
      return inserted.rows[0];
    });

    res.status(201).json(created);
  })
);

router.patch(
  "/projects/:projectId/deliveries/:deliveryId",
  requireRoles("admin", "project_manager"),
  asyncHandler(async (req, res) => {
    await assertDeliveryProjectAccess(req.ctx, req.params.projectId);
    const payload = validate(
      z.object({
        quantity: z.number().positive().optional(),
        notes: z.string().max(2000).nullable().optional(),
        photoUrl: z.string().url().nullable().optional(),
        rowVersion: z.number().int().positive().optional(),
      }),
      req.body
    );

    const updated = await withTransaction(async (client) => {
      const current = await client.query(
        `SELECT d.id, d.item_id, d.quantity, pbi.id AS bom_id, pbi.quantity AS approved_qty, pbi.delivered_quantity
         FROM deliveries d
         JOIN project_bom_items pbi
           ON pbi.project_id = d.project_id AND pbi.item_id = d.item_id
         WHERE d.id = $1 AND d.project_id = $2 AND d.tenant_id = $3
         FOR UPDATE`,
        [req.params.deliveryId, req.params.projectId, req.ctx.tenantId]
      );
      if (!current.rowCount) {
        const err = new Error("Delivery not found");
        err.status = 404;
        throw err;
      }
      const cur = current.rows[0];
      const nextQty = payload.quantity ?? Number(cur.quantity);
      const adjustedDelivered = Number(cur.delivered_quantity) - Number(cur.quantity) + Number(nextQty);
      if (adjustedDelivered > Number(cur.approved_qty)) {
        const err = new Error("Updated delivery quantity exceeds approved balance");
        err.status = 409;
        throw err;
      }

      await client.query(
        `UPDATE project_bom_items
         SET delivered_quantity = $1, updated_by = $2, updated_at = now(), row_version = row_version + 1
         WHERE id = $3`,
        [adjustedDelivered, req.ctx.userId, cur.bom_id]
      );

      const params = [payload.quantity ?? null, payload.notes ?? null, payload.photoUrl ?? null, req.params.deliveryId];
      let versionWhere = "";
      if (payload.rowVersion) {
        params.push(payload.rowVersion);
        versionWhere = ` AND row_version = $${params.length}`;
      }
      const { rows } = await client.query(
        `UPDATE deliveries
         SET quantity = COALESCE($1, quantity),
             notes = COALESCE($2, notes),
             photo_url = COALESCE($3, photo_url),
             row_version = row_version + 1
         WHERE id = $4
         ${versionWhere}
         RETURNING *`,
        params
      );
      if (!rows.length) {
        const err = new Error("Delivery has been modified by another user");
        err.status = 409;
        throw err;
      }

      await logActivity(client, {
        tenantId: req.ctx.tenantId,
        projectId: req.params.projectId,
        userId: req.ctx.userId,
        actionType: "DELIVERY_UPDATED",
        entityType: "deliveries",
        entityId: req.params.deliveryId,
        metadata: payload,
      });
      return rows[0];
    });

    res.json(updated);
  })
);

router.delete(
  "/projects/:projectId/deliveries/:deliveryId",
  requireRoles("admin", "project_manager"),
  asyncHandler(async (req, res) => {
    await assertDeliveryProjectAccess(req.ctx, req.params.projectId);
    await withTransaction(async (client) => {
      const current = await client.query(
        `SELECT d.id, d.item_id, d.quantity, pbi.id AS bom_id, pbi.delivered_quantity
         FROM deliveries d
         JOIN project_bom_items pbi
           ON pbi.project_id = d.project_id AND pbi.item_id = d.item_id
         WHERE d.id = $1 AND d.project_id = $2 AND d.tenant_id = $3
         FOR UPDATE`,
        [req.params.deliveryId, req.params.projectId, req.ctx.tenantId]
      );
      if (!current.rowCount) {
        const err = new Error("Delivery not found");
        err.status = 404;
        throw err;
      }
      const cur = current.rows[0];
      const nextDelivered = Number(cur.delivered_quantity) - Number(cur.quantity);
      await client.query(
        `UPDATE project_bom_items
         SET delivered_quantity = $1, updated_by = $2, updated_at = now(), row_version = row_version + 1
         WHERE id = $3`,
        [nextDelivered, req.ctx.userId, cur.bom_id]
      );
      await client.query(`DELETE FROM deliveries WHERE id = $1`, [req.params.deliveryId]);
      await logActivity(client, {
        tenantId: req.ctx.tenantId,
        projectId: req.params.projectId,
        userId: req.ctx.userId,
        actionType: "DELIVERY_DELETED",
        entityType: "deliveries",
        entityId: req.params.deliveryId,
        metadata: {},
      });
    });
    res.status(204).send();
  })
);

export default router;
