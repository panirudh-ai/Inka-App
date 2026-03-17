import { Router } from "express";
import { z } from "zod";
import { pool } from "../db/pool.js";
import { asyncHandler } from "../services/asyncHandler.js";
import { requireRoles } from "../middleware/auth.js";
import { validate } from "../services/validation.js";
import { asPaginated, parsePagination } from "../services/pagination.js";

const router = Router();
router.use(requireRoles("admin", "project_manager"));

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const pg = parsePagination(req.query, { defaultLimit: 50, maxLimit: 500 });
    const countResult = await pool.query(
      `SELECT COUNT(*)::int AS total
       FROM clients
       WHERE tenant_id = $1`,
      [req.ctx.tenantId]
    );

    const values = [req.ctx.tenantId];
    let limitClause = "";
    if (pg.enabled) {
      values.push(pg.limit, pg.offset);
      limitClause = `LIMIT $${values.length - 1} OFFSET $${values.length}`;
    }

    const { rows } = await pool.query(
      `SELECT c.id, c.name, c.location, c.primary_contact_name, c.primary_contact_phone, c.primary_contact_email,
              c.notes, c.is_active, c.row_version, c.created_at,
              COALESCE(pc.project_count, 0) AS project_count,
              COALESCE(pc.projects, ARRAY[]::text[]) AS associated_projects
       FROM clients c
       LEFT JOIN LATERAL (
         SELECT COUNT(*)::int AS project_count,
                ARRAY_AGG(p.name ORDER BY p.name) AS projects
         FROM projects p
         WHERE p.tenant_id = $1
           AND (
             p.client_id = c.id
             OR (p.client_id IS NULL AND lower(trim(p.client_name)) = lower(trim(c.name)))
           )
       ) pc ON TRUE
       WHERE c.tenant_id = $1
       ORDER BY c.name
       ${limitClause}`,
      values
    );

    if (pg.enabled) return res.json(asPaginated(rows, countResult.rows[0].total, pg.page, pg.limit));
    res.json(rows);
  })
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const payload = validate(
      z.object({
        name: z.string().min(2),
        location: z.string().optional().or(z.literal("")),
        primaryContactName: z.string().optional().or(z.literal("")),
        primaryContactPhone: z.string().optional().or(z.literal("")),
        primaryContactEmail: z.string().email().optional().or(z.literal("")),
        notes: z.string().optional().or(z.literal("")),
        isActive: z.boolean().default(true),
      }),
      req.body
    );
    const { rows } = await pool.query(
      `INSERT INTO clients
        (tenant_id, name, location, primary_contact_name, primary_contact_phone, primary_contact_email, notes, is_active)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING id, name, location, primary_contact_name, primary_contact_phone, primary_contact_email, notes, is_active, row_version, created_at`,
      [
        req.ctx.tenantId,
        payload.name.trim(),
        payload.location?.trim() || null,
        payload.primaryContactName?.trim() || null,
        payload.primaryContactPhone?.trim() || null,
        payload.primaryContactEmail?.trim() || null,
        payload.notes?.trim() || null,
        payload.isActive,
      ]
    );
    res.status(201).json(rows[0]);
  })
);

router.patch(
  "/:clientId",
  asyncHandler(async (req, res) => {
    const payload = validate(
      z.object({
        name: z.string().min(2).optional(),
        location: z.string().optional().or(z.literal("")),
        primaryContactName: z.string().optional().or(z.literal("")),
        primaryContactPhone: z.string().optional().or(z.literal("")),
        primaryContactEmail: z.string().email().optional().or(z.literal("")),
        notes: z.string().optional().or(z.literal("")),
        isActive: z.boolean().optional(),
        rowVersion: z.number().int().positive().optional(),
      }),
      req.body
    );

    // Build SET clause dynamically so that explicitly-cleared fields (empty string → null)
    // are actually written as NULL rather than silently kept by COALESCE.
    const params = [req.params.clientId, req.ctx.tenantId];
    const set = [];

    const addField = (col, val) => {
      set.push(`${col} = $${params.length + 1}`);
      params.push(val);
    };

    if (payload.name !== undefined)               addField("name",                  payload.name.trim());
    if (payload.location !== undefined)           addField("location",              payload.location?.trim() || null);
    if (payload.primaryContactName !== undefined) addField("primary_contact_name",  payload.primaryContactName?.trim() || null);
    if (payload.primaryContactPhone !== undefined)addField("primary_contact_phone", payload.primaryContactPhone?.trim() || null);
    if (payload.primaryContactEmail !== undefined)addField("primary_contact_email", payload.primaryContactEmail?.trim() || null);
    if (payload.notes !== undefined)              addField("notes",                 payload.notes?.trim() || null);
    if (payload.isActive !== undefined)           addField("is_active",             payload.isActive);

    if (!set.length) return res.status(400).json({ error: "No fields to update" });

    set.push("row_version = row_version + 1");

    let versionWhere = "";
    if (payload.rowVersion) {
      params.push(payload.rowVersion);
      versionWhere = ` AND row_version = $${params.length}`;
    }

    const { rows } = await pool.query(
      `UPDATE clients
       SET ${set.join(", ")}
       WHERE id = $1 AND tenant_id = $2
       ${versionWhere}
       RETURNING id, name, location, primary_contact_name, primary_contact_phone, primary_contact_email, notes, is_active, row_version, created_at`,
      params
    );
    if (!rows.length) return res.status(payload.rowVersion ? 409 : 404).json({ error: payload.rowVersion ? "Client modified by another user" : "Client not found" });
    res.json(rows[0]);
  })
);

router.delete(
  "/:clientId",
  asyncHandler(async (req, res) => {
    const result = await pool.query(
      `DELETE FROM clients
       WHERE id = $1 AND tenant_id = $2
       RETURNING id`,
      [req.params.clientId, req.ctx.tenantId]
    );
    if (!result.rowCount) return res.status(404).json({ error: "Client not found" });
    res.status(204).send();
  })
);

export default router;
