import { Router } from "express";
import { pool } from "../db/pool.js";
import { asyncHandler } from "../services/asyncHandler.js";
import { requireRoles } from "../middleware/auth.js";
import { asPaginated, parsePagination } from "../services/pagination.js";

const router = Router();

async function assertActivityProjectAccess(ctx, projectId) {
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
  const access = await pool.query(`SELECT 1 FROM projects p WHERE ${where}`, params);
  if (!access.rowCount) {
    const err = new Error("Project not found or access denied");
    err.status = 404;
    throw err;
  }
}

router.get(
  "/projects/:projectId/activity",
  requireRoles("admin", "project_manager", "engineer", "client"),
  asyncHandler(async (req, res) => {
    const pg = parsePagination(req.query, { defaultLimit: 100, maxLimit: 500 });
    await assertActivityProjectAccess(req.ctx, req.params.projectId);
    const isEngineer = req.ctx.role === "engineer";
    const isClient = req.ctx.role === "client";
    let extraFilter = "";
    if (isEngineer) {
      extraFilter = " AND al.entity_type <> 'change_requests' AND al.entity_type <> 'change_request_items'";
    } else if (isClient) {
      extraFilter =
        " AND al.entity_type <> 'change_requests' AND al.entity_type <> 'change_request_items' AND al.action_type <> 'CR_REJECTED'";
    }
    const countValues = [req.params.projectId, req.ctx.tenantId];
    const countResult = await pool.query(
      `SELECT COUNT(*)::int AS total
       FROM activity_logs al
       WHERE al.project_id = $1 AND al.tenant_id = $2
       ${extraFilter}`,
      countValues
    );
    const dataValues = [...countValues];
    let limitClause = "LIMIT 200";
    if (pg.enabled) {
      dataValues.push(pg.limit, pg.offset);
      limitClause = `LIMIT $${dataValues.length - 1} OFFSET $${dataValues.length}`;
    }

    const { rows } = await pool.query(
      `SELECT al.id, al.created_at, al.user_id, al.action_type, al.entity_type, al.entity_id, al.metadata_json,
              u.name AS user_name
       FROM activity_logs al
       LEFT JOIN users u ON u.id = al.user_id
       WHERE al.project_id = $1 AND al.tenant_id = $2
       ${extraFilter}
       ORDER BY al.created_at DESC
       ${limitClause}`,
      dataValues
    );
    if (pg.enabled) return res.json(asPaginated(rows, countResult.rows[0].total, pg.page, pg.limit));
    res.json(rows);
  })
);

export default router;
