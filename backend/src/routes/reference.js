import { Router } from "express";
import { pool } from "../db/pool.js";
import { asyncHandler } from "../services/asyncHandler.js";
import { requireRoles } from "../middleware/auth.js";

const router = Router();
router.use(requireRoles("admin", "project_manager", "engineer", "client"));

router.get(
  "/users",
  asyncHandler(async (req, res) => {
    const values = [req.ctx.tenantId];
    let where = "WHERE tenant_id = $1 AND is_active = TRUE";
    if (req.query.role) {
      values.push(req.query.role);
      where += ` AND role = $${values.length}`;
    }
    const { rows } = await pool.query(
      `SELECT id, name, email, role
       FROM users
       ${where}
       ORDER BY name`,
      values
    );
    res.json(rows);
  })
);

router.get(
  "/categories",
  asyncHandler(async (req, res) => {
    const { rows } = await pool.query(
      `SELECT id, name, sequence_order, is_active
       FROM categories
       WHERE tenant_id = $1 AND is_active = TRUE
       ORDER BY sequence_order, name`,
      [req.ctx.tenantId]
    );
    res.json(rows);
  })
);

router.get(
  "/product-types",
  asyncHandler(async (req, res) => {
    const values = [req.ctx.tenantId];
    let where = "WHERE tenant_id = $1 AND is_active = TRUE";
    if (req.query.categoryId) {
      values.push(req.query.categoryId);
      where += ` AND category_id = $${values.length}`;
    }
    const { rows } = await pool.query(
      `SELECT id, category_id, name, is_active
       FROM product_types
       ${where}
       ORDER BY name`,
      values
    );
    res.json(rows);
  })
);

router.get(
  "/brands",
  asyncHandler(async (req, res) => {
    const values = [req.ctx.tenantId];
    let joinClause = "";
    let where = "WHERE b.tenant_id = $1 AND b.is_active = TRUE";

    if (req.query.productTypeId) {
      values.push(req.query.productTypeId);
      joinClause = "JOIN items i ON i.brand_id = b.id";
      where += ` AND i.product_type_id = $${values.length} AND i.is_active = TRUE`;
    }

    const { rows } = await pool.query(
      `SELECT DISTINCT b.id, b.name, b.is_active
       FROM brands b
       ${joinClause}
       ${where}
       ORDER BY b.name`,
      values
    );
    res.json(rows);
  })
);

router.get(
  "/items",
  asyncHandler(async (req, res) => {
    const { categoryId, productTypeId, brandId } = req.query;
    const values = [req.ctx.tenantId];
    let where = "WHERE i.tenant_id = $1 AND i.is_active = TRUE";

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

    const { rows } = await pool.query(
      `SELECT i.id, i.category_id, i.product_type_id, i.brand_id, i.model_number,
              i.full_name, i.unit_of_measure, i.default_rate, i.specifications,
              c.name AS category_name, pt.name AS product_type_name, b.name AS brand_name
       FROM items i
       JOIN categories c ON c.id = i.category_id
       JOIN product_types pt ON pt.id = i.product_type_id
       JOIN brands b ON b.id = i.brand_id
       ${where}
       ORDER BY c.sequence_order, pt.name, b.name, i.model_number`,
      values
    );

    res.json(rows);
  })
);

export default router;
