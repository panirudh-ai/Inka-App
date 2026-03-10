import { Router } from "express";
import { z } from "zod";
import { pool, withTransaction } from "../db/pool.js";
import { asyncHandler } from "../services/asyncHandler.js";
import { validate } from "../services/validation.js";
import { requireRoles } from "../middleware/auth.js";
import { logActivity } from "../services/activity.js";
import { listProjectFilesFromDrive } from "../services/googleDrive.js";
import { asPaginated, parsePagination } from "../services/pagination.js";

const router = Router();

function normalizeContacts(input = []) {
  return (input || [])
    .map((c) => ({
      roleName: (c.roleName || "").trim(),
      contactName: (c.contactName || "").trim(),
      phone: (c.phone || "").trim(),
      email: (c.email || "").trim(),
      notes: (c.notes || "").trim(),
    }))
    .filter((c) => c.roleName && c.contactName);
}

async function assertProjectAccess(ctx, projectId, roles = []) {
  const params = [projectId, ctx.tenantId];
  let where = "p.id = $1 AND p.tenant_id = $2";

  if (roles.includes("engineer")) {
    params.push(ctx.userId);
    where += ` AND EXISTS (
      SELECT 1 FROM project_engineers pe
      WHERE pe.project_id = p.id AND pe.user_id = $${params.length}
    )`;
  } else if (roles.includes("client")) {
    params.push(ctx.userId);
    where += ` AND (
      p.created_by = $${params.length}
      OR EXISTS (
        SELECT 1 FROM project_clients pc
        WHERE pc.project_id = p.id AND pc.user_id = $${params.length}
      )
    )`;
  }

  const result = await pool.query(`SELECT p.id FROM projects p WHERE ${where}`, params);
  if (!result.rowCount) {
    const err = new Error("Project not found or access denied");
    err.status = 404;
    throw err;
  }
}

router.get(
  "/",
  requireRoles("admin", "project_manager", "engineer", "client"),
  asyncHandler(async (req, res) => {
    const pg = parsePagination(req.query, { defaultLimit: 50, maxLimit: 500 });
    const baseValues = [req.ctx.tenantId];
    let extraWhere = "";
    if (req.ctx.role === "engineer") {
      baseValues.push(req.ctx.userId);
      extraWhere += ` AND EXISTS (
        SELECT 1 FROM project_engineers pe
        WHERE pe.project_id = p.id AND pe.user_id = $${baseValues.length}
      )`;
    } else if (req.ctx.role === "client") {
      baseValues.push(req.ctx.userId);
      extraWhere += ` AND (
        p.created_by = $${baseValues.length}
        OR EXISTS (
          SELECT 1 FROM project_clients pc
          WHERE pc.project_id = p.id AND pc.user_id = $${baseValues.length}
        )
      )`;
    }

    const countResult = await pool.query(
      `SELECT COUNT(*)::int AS total
       FROM projects p
       WHERE p.tenant_id = $1
       ${extraWhere}`,
      baseValues
    );
    const dataValues = [...baseValues];
    let limitClause = "";
    if (pg.enabled) {
      dataValues.push(pg.limit, pg.offset);
      limitClause = `LIMIT $${dataValues.length - 1} OFFSET $${dataValues.length}`;
    }

    const { rows } = await pool.query(
      `SELECT p.id, p.name, p.client_id, p.client_name, p.location, p.drive_link, p.status, p.created_at,
              EXISTS(
                SELECT 1 FROM change_requests cr
                WHERE cr.project_id = p.id AND cr.status IN ('draft','pending')
              ) AS has_open_cr,
              (SELECT COUNT(*)::int FROM project_visits pv WHERE pv.project_id = p.id) AS visit_count,
              (
                SELECT MAX(al.created_at) FROM activity_logs al WHERE al.project_id = p.id
              ) AS last_activity
       FROM projects p
       WHERE p.tenant_id = $1
       ${extraWhere}
       ORDER BY p.created_at DESC
       ${limitClause}`,
      dataValues
    );
    if (pg.enabled) return res.json(asPaginated(rows, countResult.rows[0].total, pg.page, pg.limit));
    res.json(rows);
  })
);

router.post(
  "/",
  requireRoles("admin", "project_manager"),
  asyncHandler(async (req, res) => {
    const payload = validate(
      z.object({
        name: z.string().min(2),
        clientName: z.string().min(2).optional(),
        clientId: z.string().uuid().optional(),
        location: z.string().min(2),
        driveLink: z.string().max(2000).optional(),
        startDate: z.string().date().optional(),
        categorySequenceMode: z.boolean().default(false),
        engineerIds: z.array(z.string().uuid()).default([]),
        clientUserIds: z.array(z.string().uuid()).default([]),
        contacts: z
          .array(
            z.object({
              roleName: z.string().min(2),
              contactName: z.string().min(2),
              phone: z.string().optional(),
              email: z.string().email().optional().or(z.literal("")),
              notes: z.string().optional(),
            })
          )
          .optional()
          .default([]),
      }),
      req.body
    );

    if (!payload.clientName && !payload.clientId) {
      const err = new Error("Either clientName or clientId is required");
      err.status = 400;
      throw err;
    }

    const created = await withTransaction(async (client) => {
      let resolvedClientName = payload.clientName?.trim() || null;
      if (payload.clientId) {
        const c = await client.query(
          `SELECT id, name
           FROM clients
           WHERE id = $1 AND tenant_id = $2`,
          [payload.clientId, req.ctx.tenantId]
        );
        if (!c.rowCount) {
          const err = new Error("Client not found");
          err.status = 404;
          throw err;
        }
        if (!resolvedClientName) resolvedClientName = c.rows[0].name;
      }
      const { rows } = await client.query(
        `INSERT INTO projects
          (tenant_id, name, client_id, client_name, location, drive_link, start_date, category_sequence_mode, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [
          req.ctx.tenantId,
          payload.name,
          payload.clientId || null,
          resolvedClientName,
          payload.location,
          payload.driveLink ? payload.driveLink.trim() : null,
          payload.startDate || null,
          payload.categorySequenceMode,
          req.ctx.userId,
        ]
      );
      const project = rows[0];

      for (const engineerId of payload.engineerIds) {
        await client.query(
          `INSERT INTO project_engineers (project_id, user_id) VALUES ($1, $2)
           ON CONFLICT DO NOTHING`,
          [project.id, engineerId]
        );
      }
      for (const clientUserId of payload.clientUserIds) {
        await client.query(
          `INSERT INTO project_clients (project_id, user_id) VALUES ($1, $2)
           ON CONFLICT DO NOTHING`,
          [project.id, clientUserId]
        );
      }
      for (const contact of normalizeContacts(payload.contacts)) {
        await client.query(
          `INSERT INTO project_contacts (tenant_id, project_id, role_name, contact_name, phone, email, notes)
           VALUES ($1,$2,$3,$4,$5,$6,$7)
           ON CONFLICT (project_id, role_name, contact_name) DO NOTHING`,
          [
            req.ctx.tenantId,
            project.id,
            contact.roleName,
            contact.contactName,
            contact.phone || null,
            contact.email || null,
            contact.notes || null,
          ]
        );
      }

      await logActivity(client, {
        tenantId: req.ctx.tenantId,
        projectId: project.id,
        userId: req.ctx.userId,
        actionType: "PROJECT_CREATED",
        entityType: "project",
        entityId: project.id,
        metadata: { name: project.name },
      });

      return project;
    });

    res.status(201).json(created);
  })
);

router.get(
  "/:projectId/dashboard",
  requireRoles("admin", "project_manager", "engineer", "client"),
  asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    await assertProjectAccess(req.ctx, projectId, [req.ctx.role]);
    const projectResult = await pool.query(
      `SELECT id, name, client_id, client_name, location, drive_link, status, category_sequence_mode, start_date
       FROM projects
       WHERE id = $1 AND tenant_id = $2`,
      [projectId, req.ctx.tenantId]
    );
    if (!projectResult.rowCount) {
      return res.status(404).json({ error: "Project not found" });
    }

    const summaryResult = await pool.query(
      `SELECT
          COALESCE(SUM(quantity * rate), 0) AS total_scope_value,
          COALESCE(SUM(delivered_quantity * rate), 0) AS total_delivered_value,
          COALESCE(SUM((quantity - delivered_quantity) * rate), 0) AS total_balance_value,
          (SELECT COUNT(*)::int FROM project_visits pv WHERE pv.project_id = $1) AS visit_count
       FROM project_bom_items
       WHERE project_id = $1`,
      [projectId]
    );

    const bomResult = await pool.query(
      `SELECT pbi.id, pbi.item_id, pbi.quantity, pbi.rate, pbi.delivered_quantity, pbi.floor_label, pbi.location_description, pbi.status,
              i.model_number, i.full_name, i.unit_of_measure, c.name AS category_name, c.sequence_order,
              pt.name AS product_type_name, b.name AS brand_name
       FROM project_bom_items pbi
       JOIN items i ON i.id = pbi.item_id
       JOIN categories c ON c.id = i.category_id
       JOIN product_types pt ON pt.id = i.product_type_id
       JOIN brands b ON b.id = i.brand_id
       WHERE pbi.project_id = $1
       ORDER BY c.sequence_order, pt.name, b.name, i.model_number`,
      [projectId]
    );

    const clientMapResult = await pool.query(
      `SELECT user_id FROM project_clients WHERE project_id = $1`,
      [projectId]
    );
    const engineerMapResult = await pool.query(
      `SELECT user_id FROM project_engineers WHERE project_id = $1`,
      [projectId]
    );
    const contactsResult = await pool.query(
      `SELECT id, role_name, contact_name, phone, email, notes
       FROM project_contacts
       WHERE project_id = $1 AND tenant_id = $2
       ORDER BY role_name, contact_name`,
      [projectId, req.ctx.tenantId]
    );

    return res.json({
      project: {
        ...projectResult.rows[0],
        assigned_client_ids: clientMapResult.rows.map((r) => r.user_id),
        assigned_engineer_ids: engineerMapResult.rows.map((r) => r.user_id),
      },
      summary: summaryResult.rows[0],
      bom: bomResult.rows,
      contacts: contactsResult.rows,
    });
  })
);

router.get(
  "/:projectId/drive-files",
  requireRoles("admin", "project_manager", "engineer", "client"),
  asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    await assertProjectAccess(req.ctx, projectId, [req.ctx.role]);
    const files = await listProjectFilesFromDrive(projectId);
    res.json(files);
  })
);

router.patch(
  "/:projectId",
  requireRoles("admin", "project_manager"),
  asyncHandler(async (req, res) => {
    const payload = validate(
      z.object({
        name: z.string().min(2).optional(),
        clientName: z.string().min(2).optional(),
        clientId: z.string().uuid().optional(),
        location: z.string().min(2).optional(),
        driveLink: z.string().max(2000).nullable().optional(),
        startDate: z.string().date().nullable().optional(),
        categorySequenceMode: z.boolean().optional(),
        status: z.enum(["active", "on_hold", "completed"]).optional(),
        rowVersion: z.number().int().positive().optional(),
        engineerIds: z.array(z.string().uuid()).optional(),
        clientUserIds: z.array(z.string().uuid()).optional(),
        contacts: z
          .array(
            z.object({
              roleName: z.string().min(2),
              contactName: z.string().min(2),
              phone: z.string().optional(),
              email: z.string().email().optional().or(z.literal("")),
              notes: z.string().optional(),
            })
          )
          .optional(),
      }),
      req.body
    );

    await assertProjectAccess(req.ctx, req.params.projectId, [req.ctx.role]);
    const updated = await withTransaction(async (client) => {
      let resolvedClientName = payload.clientName ?? null;
      if (payload.clientId) {
        const c = await client.query(
          `SELECT id, name
           FROM clients
           WHERE id = $1 AND tenant_id = $2`,
          [payload.clientId, req.ctx.tenantId]
        );
        if (!c.rowCount) {
          const err = new Error("Client not found");
          err.status = 404;
          throw err;
        }
        if (!resolvedClientName) resolvedClientName = c.rows[0].name;
      }
      const params = [
        payload.name ?? null,
        resolvedClientName,
        payload.location ?? null,
        payload.driveLink === undefined ? null : (payload.driveLink ? payload.driveLink.trim() : null),
        payload.startDate === undefined ? null : payload.startDate,
        payload.categorySequenceMode ?? null,
        payload.status ?? null,
        payload.clientId ?? null,
        req.params.projectId,
        req.ctx.tenantId,
      ];
      let whereVersion = "";
      if (payload.rowVersion) {
        params.push(payload.rowVersion);
        whereVersion = ` AND row_version = $${params.length}`;
      }
      const { rows } = await client.query(
        `UPDATE projects
         SET name = COALESCE($1, name),
             client_name = COALESCE($2, client_name),
             location = COALESCE($3, location),
             drive_link = COALESCE($4, drive_link),
             start_date = COALESCE($5, start_date),
             category_sequence_mode = COALESCE($6, category_sequence_mode),
             status = COALESCE($7, status),
             client_id = COALESCE($8, client_id),
             row_version = row_version + 1
         WHERE id = $9 AND tenant_id = $10
         ${whereVersion}
         RETURNING *`,
        params
      );
      if (!rows.length) {
        const err = new Error(payload.rowVersion ? "Project has been modified by another user" : "Project not found");
        err.status = payload.rowVersion ? 409 : 404;
        throw err;
      }

      if (payload.engineerIds) {
        await client.query(`DELETE FROM project_engineers WHERE project_id = $1`, [req.params.projectId]);
        for (const engineerId of payload.engineerIds) {
          await client.query(
            `INSERT INTO project_engineers (project_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [req.params.projectId, engineerId]
          );
        }
      }
      if (payload.clientUserIds) {
        await client.query(`DELETE FROM project_clients WHERE project_id = $1`, [req.params.projectId]);
        for (const clientUserId of payload.clientUserIds) {
          await client.query(
            `INSERT INTO project_clients (project_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [req.params.projectId, clientUserId]
          );
        }
      }
      if (payload.contacts) {
        await client.query(`DELETE FROM project_contacts WHERE project_id = $1 AND tenant_id = $2`, [
          req.params.projectId,
          req.ctx.tenantId,
        ]);
        for (const contact of normalizeContacts(payload.contacts)) {
          await client.query(
            `INSERT INTO project_contacts (tenant_id, project_id, role_name, contact_name, phone, email, notes)
             VALUES ($1,$2,$3,$4,$5,$6,$7)`,
            [
              req.ctx.tenantId,
              req.params.projectId,
              contact.roleName,
              contact.contactName,
              contact.phone || null,
              contact.email || null,
              contact.notes || null,
            ]
          );
        }
      }

      await logActivity(client, {
        tenantId: req.ctx.tenantId,
        projectId: req.params.projectId,
        userId: req.ctx.userId,
        actionType: "PROJECT_UPDATED",
        entityType: "project",
        entityId: req.params.projectId,
        metadata: payload,
      });
      return rows[0];
    });

    res.json(updated);
  })
);

router.get(
  "/:projectId/contacts",
  requireRoles("admin", "project_manager", "engineer", "client"),
  asyncHandler(async (req, res) => {
    await assertProjectAccess(req.ctx, req.params.projectId, [req.ctx.role]);
    const { rows } = await pool.query(
      `SELECT id, role_name, contact_name, phone, email, notes, created_at
       FROM project_contacts
       WHERE project_id = $1 AND tenant_id = $2
       ORDER BY role_name, contact_name`,
      [req.params.projectId, req.ctx.tenantId]
    );
    res.json(rows);
  })
);

router.put(
  "/:projectId/contacts",
  requireRoles("admin", "project_manager"),
  asyncHandler(async (req, res) => {
    const payload = validate(
      z.object({
        contacts: z
          .array(
            z.object({
              roleName: z.string().min(2),
              contactName: z.string().min(2),
              phone: z.string().optional(),
              email: z.string().email().optional().or(z.literal("")),
              notes: z.string().optional(),
            })
          )
          .default([]),
      }),
      req.body
    );
    await assertProjectAccess(req.ctx, req.params.projectId, [req.ctx.role]);
    const rows = await withTransaction(async (client) => {
      await client.query(`DELETE FROM project_contacts WHERE project_id = $1 AND tenant_id = $2`, [
        req.params.projectId,
        req.ctx.tenantId,
      ]);
      for (const contact of normalizeContacts(payload.contacts)) {
        await client.query(
          `INSERT INTO project_contacts (tenant_id, project_id, role_name, contact_name, phone, email, notes)
           VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [
            req.ctx.tenantId,
            req.params.projectId,
            contact.roleName,
            contact.contactName,
            contact.phone || null,
            contact.email || null,
            contact.notes || null,
          ]
        );
      }
      const listed = await client.query(
        `SELECT id, role_name, contact_name, phone, email, notes, created_at
         FROM project_contacts
         WHERE project_id = $1 AND tenant_id = $2
         ORDER BY role_name, contact_name`,
        [req.params.projectId, req.ctx.tenantId]
      );
      await logActivity(client, {
        tenantId: req.ctx.tenantId,
        projectId: req.params.projectId,
        userId: req.ctx.userId,
        actionType: "PROJECT_CONTACTS_UPDATED",
        entityType: "project",
        entityId: req.params.projectId,
        metadata: { count: listed.rowCount },
      });
      return listed.rows;
    });
    res.json(rows);
  })
);

router.get(
  "/:projectId/visits",
  requireRoles("admin", "project_manager", "engineer", "client"),
  asyncHandler(async (req, res) => {
    await assertProjectAccess(req.ctx, req.params.projectId, [req.ctx.role]);
    const pg = parsePagination(req.query, { defaultLimit: 50, maxLimit: 500 });
    const countResult = await pool.query(
      `SELECT COUNT(*)::int AS total
       FROM project_visits
       WHERE project_id = $1 AND tenant_id = $2`,
      [req.params.projectId, req.ctx.tenantId]
    );
    const values = [req.params.projectId, req.ctx.tenantId];
    let limitClause = "";
    if (pg.enabled) {
      values.push(pg.limit, pg.offset);
      limitClause = `LIMIT $${values.length - 1} OFFSET $${values.length}`;
    }
    const { rows } = await pool.query(
      `SELECT pv.id, pv.project_id, pv.engineer_id, pv.visit_date, pv.notes, pv.created_at, u.name AS engineer_name
       FROM project_visits pv
       LEFT JOIN users u ON u.id = pv.engineer_id
       WHERE pv.project_id = $1 AND pv.tenant_id = $2
       ORDER BY pv.created_at DESC
       ${limitClause}`,
      values
    );
    if (pg.enabled) return res.json(asPaginated(rows, countResult.rows[0].total, pg.page, pg.limit));
    res.json(rows);
  })
);

router.get(
  "/:projectId/visits/summary",
  requireRoles("admin", "project_manager", "engineer", "client"),
  asyncHandler(async (req, res) => {
    await assertProjectAccess(req.ctx, req.params.projectId, [req.ctx.role]);
    const [totalsRes, byEngineerRes, byMonthRes] = await Promise.all([
      pool.query(
        `SELECT COUNT(*)::int AS total_visits,
                COUNT(DISTINCT engineer_id)::int AS engineer_count,
                MIN(visit_date) AS first_visit_date,
                MAX(visit_date) AS last_visit_date
         FROM project_visits
         WHERE project_id = $1 AND tenant_id = $2`,
        [req.params.projectId, req.ctx.tenantId]
      ),
      pool.query(
        `SELECT pv.engineer_id, COALESCE(u.name, 'Unknown') AS engineer_name, COUNT(*)::int AS visit_count
         FROM project_visits pv
         LEFT JOIN users u ON u.id = pv.engineer_id
         WHERE pv.project_id = $1 AND pv.tenant_id = $2
         GROUP BY pv.engineer_id, u.name
         ORDER BY visit_count DESC, engineer_name ASC`,
        [req.params.projectId, req.ctx.tenantId]
      ),
      pool.query(
        `SELECT to_char(date_trunc('month', pv.visit_date), 'YYYY-MM') AS month_key,
                COUNT(*)::int AS visit_count
         FROM project_visits pv
         WHERE pv.project_id = $1 AND pv.tenant_id = $2
         GROUP BY date_trunc('month', pv.visit_date)
         ORDER BY month_key DESC`,
        [req.params.projectId, req.ctx.tenantId]
      ),
    ]);

    res.json({
      totals: totalsRes.rows[0],
      byEngineer: byEngineerRes.rows,
      byMonth: byMonthRes.rows,
    });
  })
);

router.post(
  "/:projectId/visits",
  requireRoles("admin", "project_manager", "engineer"),
  asyncHandler(async (req, res) => {
    await assertProjectAccess(req.ctx, req.params.projectId, [req.ctx.role]);
    const payload = validate(
      z.object({
        visitDate: z.string().date().optional(),
        notes: z.string().max(500).optional(),
        engineerId: z.string().uuid().optional(),
      }),
      req.body || {}
    );
    const engineerId = req.ctx.role === "engineer" ? req.ctx.userId : payload.engineerId || req.ctx.userId;
    const { rows } = await pool.query(
      `INSERT INTO project_visits (tenant_id, project_id, engineer_id, visit_date, notes)
       VALUES ($1,$2,$3,$4,$5)
       RETURNING *`,
      [
        req.ctx.tenantId,
        req.params.projectId,
        engineerId,
        payload.visitDate || new Date().toISOString().slice(0, 10),
        payload.notes || null,
      ]
    );
    await pool.query(
      `INSERT INTO activity_logs
        (tenant_id, project_id, user_id, action_type, entity_type, entity_id, metadata_json)
       VALUES ($1,$2,$3,'SITE_VISIT_LOGGED','project_visits',$4,$5)`,
      [req.ctx.tenantId, req.params.projectId, req.ctx.userId, rows[0].id, { visitDate: rows[0].visit_date }]
    );
    res.status(201).json(rows[0]);
  })
);

router.delete(
  "/:projectId",
  requireRoles("admin", "project_manager"),
  asyncHandler(async (req, res) => {
    await assertProjectAccess(req.ctx, req.params.projectId, [req.ctx.role]);
    await withTransaction(async (client) => {
      await logActivity(client, {
        tenantId: req.ctx.tenantId,
        projectId: req.params.projectId,
        userId: req.ctx.userId,
        actionType: "PROJECT_DELETED",
        entityType: "project",
        entityId: req.params.projectId,
        metadata: {},
      });
      await client.query(`DELETE FROM projects WHERE id = $1 AND tenant_id = $2`, [
        req.params.projectId,
        req.ctx.tenantId,
      ]);
    });
    res.status(204).send();
  })
);

router.post(
  "/:projectId/bom-items",
  requireRoles("admin", "project_manager"),
  asyncHandler(async (req, res) => {
    return res.status(403).json({
      error: "Live BOM editing is disabled. Use Change Request workflow for all scope changes.",
    });
  })
);

router.patch(
  "/:projectId/bom-items/:bomItemId/status",
  requireRoles("engineer", "project_manager", "admin"),
  asyncHandler(async (req, res) => {
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
    const payload = validate(
      z.object({
        status: z.enum(statuses),
        rowVersion: z.number().int().positive().optional(),
      }),
      req.body
    );

    const { bomItemId, projectId } = req.params;
    await assertProjectAccess(req.ctx, projectId, [req.ctx.role]);
    const params = [payload.status, req.ctx.userId, bomItemId, projectId];
    let versionWhere = "";
    if (payload.rowVersion) {
      params.push(payload.rowVersion);
      versionWhere = ` AND row_version = $${params.length}`;
    }
    const { rows } = await pool.query(
      `UPDATE project_bom_items
       SET status = $1, updated_by = $2, updated_at = now(), row_version = row_version + 1
       WHERE id = $3 AND project_id = $4
       ${versionWhere}
       RETURNING *`,
      params
    );
    if (!rows.length) {
      return res.status(payload.rowVersion ? 409 : 404).json({
        error: payload.rowVersion ? "BOM item has been modified by another user" : "BOM item not found",
      });
    }

    await pool.query(
      `INSERT INTO activity_logs
        (tenant_id, project_id, user_id, action_type, entity_type, entity_id, metadata_json)
       VALUES ($1,$2,$3,'STATUS_UPDATED','project_bom_items',$4,$5)`,
      [req.ctx.tenantId, projectId, req.ctx.userId, bomItemId, { status: payload.status }]
    );

    return res.json(rows[0]);
  })
);

export default router;
