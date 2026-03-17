import { Router } from "express";
import { z } from "zod";
import { pool } from "../db/pool.js";
import { asyncHandler } from "../services/asyncHandler.js";
import { validate } from "../services/validation.js";
import { requireRoles } from "../middleware/auth.js";
import { asPaginated, parsePagination } from "../services/pagination.js";

const router = Router();
router.use(requireRoles("admin"));

router.get(
  "/activity/recent",
  asyncHandler(async (req, res) => {
    const pg = parsePagination(req.query, { defaultLimit: 20, maxLimit: 200 });
    const countResult = await pool.query(
      `SELECT COUNT(*)::int AS total FROM activity_logs WHERE tenant_id = $1`,
      [req.ctx.tenantId]
    );
    const values = [req.ctx.tenantId];
    let limitClause = "LIMIT 20";
    if (pg.enabled) {
      values.push(pg.limit, pg.offset);
      limitClause = `LIMIT $${values.length - 1} OFFSET $${values.length}`;
    }
    const { rows } = await pool.query(
      `SELECT al.id, al.created_at, al.action_type, al.entity_type, al.entity_id, al.metadata_json,
              u.name AS user_name, p.name AS project_name
       FROM activity_logs al
       LEFT JOIN users u ON u.id = al.user_id
       LEFT JOIN projects p ON p.id = al.project_id
       WHERE al.tenant_id = $1
       ORDER BY al.created_at DESC
       ${limitClause}`,
      values
    );
    if (pg.enabled) return res.json(asPaginated(rows, countResult.rows[0].total, pg.page, pg.limit));
    res.json(rows);
  })
);

router.get(
  "/categories",
  asyncHandler(async (req, res) => {
    const pg = parsePagination(req.query, { defaultLimit: 50, maxLimit: 500 });
    const countResult = await pool.query(
      `SELECT COUNT(*)::int AS total FROM categories WHERE tenant_id = $1`,
      [req.ctx.tenantId]
    );
    const values = [req.ctx.tenantId];
    let limitClause = "";
    if (pg.enabled) {
      values.push(pg.limit, pg.offset);
      limitClause = `LIMIT $${values.length - 1} OFFSET $${values.length}`;
    }
    const { rows } = await pool.query(
      `SELECT id, name, sequence_order, is_active
       FROM categories
       WHERE tenant_id = $1
       ORDER BY sequence_order, name
       ${limitClause}`,
      values
    );
    if (pg.enabled) return res.json(asPaginated(rows, countResult.rows[0].total, pg.page, pg.limit));
    res.json(rows);
  })
);

router.post(
  "/categories",
  asyncHandler(async (req, res) => {
    const payload = validate(
      z.object({
        name: z.string().min(2),
        sequenceOrder: z.number().int().min(1).default(1),
        isActive: z.boolean().default(true),
      }),
      req.body
    );
    const { rows } = await pool.query(
      `INSERT INTO categories (tenant_id, name, sequence_order, is_active)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, sequence_order, is_active`,
      [req.ctx.tenantId, payload.name, payload.sequenceOrder, payload.isActive]
    );
    res.status(201).json(rows[0]);
  })
);

router.delete(
  "/categories/:id",
  asyncHandler(async (req, res) => {
    try {
      const result = await pool.query(
        `DELETE FROM categories WHERE id = $1 AND tenant_id = $2 RETURNING id`,
        [req.params.id, req.ctx.tenantId]
      );
      if (!result.rowCount) return res.status(404).json({ error: "Category not found" });
      res.status(204).send();
    } catch (e) {
      if (e.code === "23503") {
        return res.status(409).json({ error: "Category is in use by product types and cannot be deleted" });
      }
      throw e;
    }
  })
);

router.patch(
  "/categories/:id",
  asyncHandler(async (req, res) => {
    const payload = validate(
      z.object({
        name: z.string().min(2).optional(),
        sequenceOrder: z.number().int().min(1).optional(),
        isActive: z.boolean().optional(),
        rowVersion: z.number().int().positive().optional(),
      }),
      req.body
    );
    const current = await pool.query(
      `SELECT id FROM categories WHERE id = $1 AND tenant_id = $2`,
      [req.params.id, req.ctx.tenantId]
    );
    if (!current.rowCount) return res.status(404).json({ error: "Category not found" });

    const params = [req.params.id, req.ctx.tenantId];
    const set = [];
    const add = (col, val) => { set.push(`${col} = $${params.length + 1}`); params.push(val); };

    if (payload.name !== undefined)          add("name",           payload.name.trim());
    if (payload.sequenceOrder !== undefined) add("sequence_order", payload.sequenceOrder);
    if (payload.isActive !== undefined)      add("is_active",      payload.isActive);
    if (!set.length) return res.status(400).json({ error: "No fields to update" });
    set.push("row_version = row_version + 1");

    let versionWhere = "";
    if (payload.rowVersion) {
      params.push(payload.rowVersion);
      versionWhere = ` AND row_version = $${params.length}`;
    }
    const { rows } = await pool.query(
      `UPDATE categories
       SET ${set.join(", ")}
       WHERE id = $1 AND tenant_id = $2
       ${versionWhere}
       RETURNING id, name, sequence_order, is_active`,
      params
    );
    if (!rows.length) return res.status(409).json({ error: "Category modified by another user" });
    res.json(rows[0]);
  })
);

router.get(
  "/users",
  asyncHandler(async (req, res) => {
    const pg = parsePagination(req.query, { defaultLimit: 50, maxLimit: 500 });
    const { role } = req.query;
    const values = [req.ctx.tenantId];
    let where = "WHERE tenant_id = $1";
    if (role) {
      values.push(role);
      where += ` AND role = $${values.length}`;
    }
    const count = await pool.query(`SELECT COUNT(*)::int AS total FROM users ${where}`, values);
    const dataValues = [...values];
    let limitClause = "";
    if (pg.enabled) {
      dataValues.push(pg.limit, pg.offset);
      limitClause = `LIMIT $${dataValues.length - 1} OFFSET $${dataValues.length}`;
    }
    const { rows } = await pool.query(
      `SELECT id, name, email, role, is_active, created_at
       FROM users
       ${where}
       ORDER BY created_at DESC
       ${limitClause}`,
      dataValues
    );
    if (pg.enabled) return res.json(asPaginated(rows, count.rows[0].total, pg.page, pg.limit));
    res.json(rows);
  })
);

router.post(
  "/users",
  asyncHandler(async (req, res) => {
    const payload = validate(
      z.object({
        name: z.string().min(2),
        email: z.string().email(),
        role: z.enum(["admin", "project_manager", "engineer", "client"]),
        password: z.string().min(6),
        isActive: z.boolean().default(true),
      }),
      req.body
    );
    const { rows } = await pool.query(
      `INSERT INTO users (tenant_id, name, email, role, password_hash, is_active)
       VALUES ($1, $2, $3, $4, crypt($5, gen_salt('bf')), $6)
       RETURNING id, name, email, role, is_active, created_at`,
      [
        req.ctx.tenantId,
        payload.name,
        payload.email.toLowerCase(),
        payload.role,
        payload.password,
        payload.isActive,
      ]
    );
    res.status(201).json(rows[0]);
  })
);

router.patch(
  "/users/:id",
  asyncHandler(async (req, res) => {
    const payload = validate(
      z.object({
        name: z.string().min(2).optional(),
        role: z.enum(["admin", "project_manager", "engineer", "client"]).optional(),
        isActive: z.boolean().optional(),
        password: z.string().min(6).optional(),
      }),
      req.body
    );
    const params = [req.params.id, req.ctx.tenantId];
    const set = [];
    const add = (col, val) => { set.push(`${col} = $${params.length + 1}`); params.push(val); };

    if (payload.name !== undefined)     add("name",      payload.name.trim());
    if (payload.role !== undefined)     add("role",      payload.role);
    if (payload.isActive !== undefined) add("is_active", payload.isActive);
    if (payload.password !== undefined) {
      set.push(`password_hash = crypt($${params.length + 1}, gen_salt('bf'))`);
      params.push(payload.password);
    }
    if (!set.length) return res.status(400).json({ error: "No fields to update" });

    const { rows } = await pool.query(
      `UPDATE users
       SET ${set.join(", ")}
       WHERE id = $1 AND tenant_id = $2
       RETURNING id, name, email, role, is_active, created_at`,
      params
    );
    if (!rows.length) return res.status(404).json({ error: "User not found" });
    res.json(rows[0]);
  })
);

router.get(
  "/product-types",
  asyncHandler(async (req, res) => {
    const pg = parsePagination(req.query, { defaultLimit: 50, maxLimit: 500 });
    const categoryId = req.query.categoryId;
    const values = [req.ctx.tenantId];
    let where = "WHERE pt.tenant_id = $1";
    if (categoryId) {
      values.push(categoryId);
      where += ` AND pt.category_id = $${values.length}`;
    }
    const count = await pool.query(
      `SELECT COUNT(*)::int AS total
       FROM product_types pt
       ${where}`,
      values
    );
    const dataValues = [...values];
    let limitClause = "";
    if (pg.enabled) {
      dataValues.push(pg.limit, pg.offset);
      limitClause = `LIMIT $${dataValues.length - 1} OFFSET $${dataValues.length}`;
    }
    const { rows } = await pool.query(
      `SELECT pt.id, pt.name, pt.is_active, pt.category_id, c.name AS category_name
       FROM product_types pt
       JOIN categories c ON c.id = pt.category_id
       ${where}
       ORDER BY c.sequence_order, pt.name
       ${limitClause}`,
      dataValues
    );
    if (pg.enabled) return res.json(asPaginated(rows, count.rows[0].total, pg.page, pg.limit));
    res.json(rows);
  })
);

router.post(
  "/product-types",
  asyncHandler(async (req, res) => {
    const payload = validate(
      z.object({
        categoryId: z.string().uuid(),
        name: z.string().min(2),
        isActive: z.boolean().default(true),
      }),
      req.body
    );

    const cat = await pool.query(`SELECT id FROM categories WHERE id = $1 AND tenant_id = $2`, [
      payload.categoryId,
      req.ctx.tenantId,
    ]);
    if (!cat.rowCount) return res.status(404).json({ error: "Category not found" });

    const { rows } = await pool.query(
      `INSERT INTO product_types (tenant_id, category_id, name, is_active)
       VALUES ($1, $2, $3, $4)
       RETURNING id, category_id, name, is_active`,
      [req.ctx.tenantId, payload.categoryId, payload.name, payload.isActive]
    );
    res.status(201).json(rows[0]);
  })
);

router.delete(
  "/product-types/:id",
  asyncHandler(async (req, res) => {
    try {
      const result = await pool.query(
        `DELETE FROM product_types WHERE id = $1 AND tenant_id = $2 RETURNING id`,
        [req.params.id, req.ctx.tenantId]
      );
      if (!result.rowCount) return res.status(404).json({ error: "Product type not found" });
      res.status(204).send();
    } catch (e) {
      if (e.code === "23503") {
        return res.status(409).json({ error: "Product type is in use by models and cannot be deleted" });
      }
      throw e;
    }
  })
);

router.patch(
  "/product-types/:id",
  asyncHandler(async (req, res) => {
    const payload = validate(
      z.object({
        name: z.string().min(2).optional(),
        categoryId: z.string().uuid().optional(),
        isActive: z.boolean().optional(),
        rowVersion: z.number().int().positive().optional(),
      }),
      req.body
    );
    const current = await pool.query(
      `SELECT id FROM product_types WHERE id = $1 AND tenant_id = $2`,
      [req.params.id, req.ctx.tenantId]
    );
    if (!current.rowCount) return res.status(404).json({ error: "Product type not found" });
    if (payload.categoryId) {
      const cat = await pool.query(`SELECT id FROM categories WHERE id = $1 AND tenant_id = $2`, [
        payload.categoryId,
        req.ctx.tenantId,
      ]);
      if (!cat.rowCount) return res.status(404).json({ error: "Category not found" });
    }

    const params = [req.params.id, req.ctx.tenantId];
    const set = [];
    const add = (col, val) => { set.push(`${col} = $${params.length + 1}`); params.push(val); };

    if (payload.name !== undefined)       add("name",        payload.name.trim());
    if (payload.categoryId !== undefined) add("category_id", payload.categoryId);
    if (payload.isActive !== undefined)   add("is_active",   payload.isActive);
    if (!set.length) return res.status(400).json({ error: "No fields to update" });
    set.push("row_version = row_version + 1");

    let versionWhere = "";
    if (payload.rowVersion) {
      params.push(payload.rowVersion);
      versionWhere = ` AND row_version = $${params.length}`;
    }
    const { rows } = await pool.query(
      `UPDATE product_types
       SET ${set.join(", ")}
       WHERE id = $1 AND tenant_id = $2
       ${versionWhere}
       RETURNING id, category_id, name, is_active`,
      params
    );
    if (!rows.length) return res.status(409).json({ error: "Product type modified by another user" });
    res.json(rows[0]);
  })
);

router.get(
  "/brands",
  asyncHandler(async (req, res) => {
    const pg = parsePagination(req.query, { defaultLimit: 50, maxLimit: 500 });
    const count = await pool.query(`SELECT COUNT(*)::int AS total FROM brands WHERE tenant_id = $1`, [
      req.ctx.tenantId,
    ]);
    const values = [req.ctx.tenantId];
    let limitClause = "";
    if (pg.enabled) {
      values.push(pg.limit, pg.offset);
      limitClause = `LIMIT $${values.length - 1} OFFSET $${values.length}`;
    }
    const { rows } = await pool.query(
      `SELECT id, name, is_active
       FROM brands
       WHERE tenant_id = $1
       ORDER BY name
       ${limitClause}`,
      values
    );
    if (pg.enabled) return res.json(asPaginated(rows, count.rows[0].total, pg.page, pg.limit));
    res.json(rows);
  })
);

router.post(
  "/brands",
  asyncHandler(async (req, res) => {
    const payload = validate(
      z.object({
        name: z.string().min(2),
        isActive: z.boolean().default(true),
      }),
      req.body
    );
    const { rows } = await pool.query(
      `INSERT INTO brands (tenant_id, name, is_active)
       VALUES ($1, $2, $3)
       RETURNING id, name, is_active`,
      [req.ctx.tenantId, payload.name, payload.isActive]
    );
    res.status(201).json(rows[0]);
  })
);

router.delete(
  "/brands/:id",
  asyncHandler(async (req, res) => {
    try {
      const result = await pool.query(`DELETE FROM brands WHERE id = $1 AND tenant_id = $2 RETURNING id`, [
        req.params.id,
        req.ctx.tenantId,
      ]);
      if (!result.rowCount) return res.status(404).json({ error: "Brand not found" });
      res.status(204).send();
    } catch (e) {
      if (e.code === "23503") {
        return res.status(409).json({ error: "Brand is in use by models and cannot be deleted" });
      }
      throw e;
    }
  })
);

router.patch(
  "/brands/:id",
  asyncHandler(async (req, res) => {
    const payload = validate(
      z.object({
        name: z.string().min(2).optional(),
        isActive: z.boolean().optional(),
        rowVersion: z.number().int().positive().optional(),
      }),
      req.body
    );
    const current = await pool.query(
      `SELECT id FROM brands WHERE id = $1 AND tenant_id = $2`,
      [req.params.id, req.ctx.tenantId]
    );
    if (!current.rowCount) return res.status(404).json({ error: "Brand not found" });

    const params = [req.params.id, req.ctx.tenantId];
    const set = [];
    const add = (col, val) => { set.push(`${col} = $${params.length + 1}`); params.push(val); };

    if (payload.name !== undefined)     add("name",      payload.name.trim());
    if (payload.isActive !== undefined) add("is_active", payload.isActive);
    if (!set.length) return res.status(400).json({ error: "No fields to update" });
    set.push("row_version = row_version + 1");

    let versionWhere = "";
    if (payload.rowVersion) {
      params.push(payload.rowVersion);
      versionWhere = ` AND row_version = $${params.length}`;
    }
    const { rows } = await pool.query(
      `UPDATE brands
       SET ${set.join(", ")}
       WHERE id = $1 AND tenant_id = $2
       ${versionWhere}
       RETURNING id, name, is_active`,
      params
    );
    if (!rows.length) return res.status(409).json({ error: "Brand modified by another user" });
    res.json(rows[0]);
  })
);

router.get(
  "/items",
  asyncHandler(async (req, res) => {
    const pg = parsePagination(req.query, { defaultLimit: 50, maxLimit: 500 });
    const { categoryId, productTypeId, brandId } = req.query;
    const values = [req.ctx.tenantId];
    let where = "WHERE i.tenant_id = $1";

    for (const [field, val] of [
      ["i.category_id", categoryId],
      ["i.product_type_id", productTypeId],
      ["i.brand_id", brandId],
    ]) {
      if (val) {
        values.push(val);
        where += ` AND ${field} = $${values.length}`;
      }
    }

    const count = await pool.query(
      `SELECT COUNT(*)::int AS total
       FROM items i
       ${where}`,
      values
    );
    const dataValues = [...values];
    let limitClause = "";
    if (pg.enabled) {
      dataValues.push(pg.limit, pg.offset);
      limitClause = `LIMIT $${dataValues.length - 1} OFFSET $${dataValues.length}`;
    }
    const { rows } = await pool.query(
      `SELECT i.id, i.category_id, i.product_type_id, i.brand_id, i.model_number,
              i.full_name, i.unit_of_measure, i.default_rate, i.specifications, i.is_active,
              c.name AS category_name, pt.name AS product_type_name, b.name AS brand_name
       FROM items i
       JOIN categories c ON c.id = i.category_id
       JOIN product_types pt ON pt.id = i.product_type_id
       JOIN brands b ON b.id = i.brand_id
       ${where}
       ORDER BY c.sequence_order, pt.name, b.name, i.model_number
       ${limitClause}`,
      dataValues
    );

    if (pg.enabled) return res.json(asPaginated(rows, count.rows[0].total, pg.page, pg.limit));
    res.json(rows);
  })
);

router.post(
  "/items",
  asyncHandler(async (req, res) => {
    const payload = validate(
      z.object({
        categoryId: z.string().uuid(),
        productTypeId: z.string().uuid(),
        brandId: z.string().uuid(),
        modelNumber: z.string().min(1),
        fullName: z.string().min(2),
        unitOfMeasure: z.string().min(1),
        defaultRate: z.number().min(0).default(0),
        specifications: z.record(z.any()).default({}),
        isActive: z.boolean().default(true),
      }),
      req.body
    );

    const refs = await pool.query(
      `SELECT
         EXISTS(SELECT 1 FROM categories WHERE id = $1 AND tenant_id = $4) AS category_ok,
         EXISTS(SELECT 1 FROM product_types WHERE id = $2 AND tenant_id = $4) AS product_type_ok,
         EXISTS(SELECT 1 FROM brands WHERE id = $3 AND tenant_id = $4) AS brand_ok`,
      [payload.categoryId, payload.productTypeId, payload.brandId, req.ctx.tenantId]
    );
    if (!refs.rows[0].category_ok) return res.status(404).json({ error: "Category not found" });
    if (!refs.rows[0].product_type_ok) return res.status(404).json({ error: "Product type not found" });
    if (!refs.rows[0].brand_ok) return res.status(404).json({ error: "Brand not found" });

    const { rows } = await pool.query(
      `INSERT INTO items
        (tenant_id, category_id, product_type_id, brand_id, model_number, full_name, unit_of_measure, default_rate, specifications, is_active)
       VALUES
        ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING id, category_id, product_type_id, brand_id, model_number, full_name, unit_of_measure, default_rate, specifications, is_active`,
      [
        req.ctx.tenantId,
        payload.categoryId,
        payload.productTypeId,
        payload.brandId,
        payload.modelNumber,
        payload.fullName,
        payload.unitOfMeasure,
        payload.defaultRate,
        payload.specifications,
        payload.isActive,
      ]
    );
    res.status(201).json(rows[0]);
  })
);

router.delete(
  "/items/:id",
  asyncHandler(async (req, res) => {
    try {
      const result = await pool.query(`DELETE FROM items WHERE id = $1 AND tenant_id = $2 RETURNING id`, [
        req.params.id,
        req.ctx.tenantId,
      ]);
      if (!result.rowCount) return res.status(404).json({ error: "Model not found" });
      res.status(204).send();
    } catch (e) {
      if (e.code === "23503") {
        return res.status(409).json({ error: "Model is in use by projects/BOMs and cannot be deleted" });
      }
      throw e;
    }
  })
);

router.delete(
  "/users/:id",
  asyncHandler(async (req, res) => {
    if (req.params.id === req.ctx.userId) {
      return res.status(409).json({ error: "You cannot delete your own user" });
    }
    const result = await pool.query(`DELETE FROM users WHERE id = $1 AND tenant_id = $2 RETURNING id`, [
      req.params.id,
      req.ctx.tenantId,
    ]);
    if (!result.rowCount) return res.status(404).json({ error: "User not found" });
    res.status(204).send();
  })
);

router.patch(
  "/items/:id",
  asyncHandler(async (req, res) => {
    const payload = validate(
      z.object({
        categoryId: z.string().uuid().optional(),
        productTypeId: z.string().uuid().optional(),
        brandId: z.string().uuid().optional(),
        modelNumber: z.string().min(1).optional(),
        fullName: z.string().min(2).optional(),
        unitOfMeasure: z.string().min(1).optional(),
        defaultRate: z.number().min(0).optional(),
        specifications: z.record(z.any()).optional(),
        isActive: z.boolean().optional(),
        rowVersion: z.number().int().positive().optional(),
      }),
      req.body
    );
    const current = await pool.query(
      `SELECT id FROM items WHERE id = $1 AND tenant_id = $2`,
      [req.params.id, req.ctx.tenantId]
    );
    if (!current.rowCount) return res.status(404).json({ error: "Model not found" });
    if (payload.categoryId) {
      const cat = await pool.query(`SELECT id FROM categories WHERE id = $1 AND tenant_id = $2`, [
        payload.categoryId,
        req.ctx.tenantId,
      ]);
      if (!cat.rowCount) return res.status(404).json({ error: "Category not found" });
    }
    if (payload.productTypeId) {
      const pt = await pool.query(`SELECT id FROM product_types WHERE id = $1 AND tenant_id = $2`, [
        payload.productTypeId,
        req.ctx.tenantId,
      ]);
      if (!pt.rowCount) return res.status(404).json({ error: "Product type not found" });
    }
    if (payload.brandId) {
      const br = await pool.query(`SELECT id FROM brands WHERE id = $1 AND tenant_id = $2`, [
        payload.brandId,
        req.ctx.tenantId,
      ]);
      if (!br.rowCount) return res.status(404).json({ error: "Brand not found" });
    }

    const params = [req.params.id];
    const set = [];
    const add = (col, val) => { set.push(`${col} = $${params.length + 1}`); params.push(val); };

    if (payload.categoryId !== undefined)    add("category_id",      payload.categoryId ?? null);
    if (payload.productTypeId !== undefined) add("product_type_id",  payload.productTypeId ?? null);
    if (payload.brandId !== undefined)       add("brand_id",         payload.brandId ?? null);
    if (payload.modelNumber !== undefined)   add("model_number",     payload.modelNumber);
    if (payload.fullName !== undefined)      add("full_name",        payload.fullName);
    if (payload.unitOfMeasure !== undefined) add("unit_of_measure",  payload.unitOfMeasure?.trim() || null);
    if (payload.defaultRate !== undefined)   add("default_rate",     payload.defaultRate ?? null);
    if (payload.specifications !== undefined)add("specifications",   payload.specifications ?? null);
    if (payload.isActive !== undefined)      add("is_active",        payload.isActive);
    set.push("row_version = row_version + 1");

    let versionWhere = "";
    if (payload.rowVersion) {
      params.push(payload.rowVersion);
      versionWhere = ` AND row_version = $${params.length}`;
    }
    const { rows } = await pool.query(
      `UPDATE items
       SET ${set.join(", ")}
       WHERE id = $1
       ${versionWhere}
       RETURNING id, category_id, product_type_id, brand_id, model_number, full_name, unit_of_measure, default_rate, specifications, is_active`,
      params
    );
    if (!rows.length) return res.status(409).json({ error: "Model modified by another user" });
    res.json(rows[0]);
  })
);

export default router;
