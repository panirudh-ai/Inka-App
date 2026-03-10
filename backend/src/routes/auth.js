import { Router } from "express";
import { z } from "zod";
import { pool } from "../db/pool.js";
import { asyncHandler } from "../services/asyncHandler.js";
import { validate } from "../services/validation.js";
import { signAuthToken } from "../services/jwt.js";

const router = Router();

router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const payload = validate(
      z.object({
        email: z.string().email(),
        password: z.string().min(6),
      }),
      req.body
    );

    const { rows } = await pool.query(
      `SELECT id, tenant_id, name, email, role, is_active
       FROM users
       WHERE email = $1
         AND is_active = TRUE
         AND password_hash = crypt($2, password_hash)
       LIMIT 1`,
      [payload.email.toLowerCase(), payload.password]
    );

    if (!rows.length) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const user = rows[0];
    const token = signAuthToken({
      tenantId: user.tenant_id,
      userId: user.id,
      role: user.role,
    });

    res.json({
      token,
      user: {
        id: user.id,
        tenantId: user.tenant_id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  })
);

router.get(
  "/me",
  asyncHandler(async (req, res) => {
    const auth = req.header("authorization") || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const { rows } = await pool.query(
      `SELECT id, tenant_id, name, email, role
       FROM users
       WHERE id = $1 AND tenant_id = $2 AND is_active = TRUE`,
      [req.ctx?.userId || null, req.ctx?.tenantId || null]
    );

    if (!rows.length) return res.status(401).json({ error: "Unauthorized" });

    const user = rows[0];
    return res.json({
      id: user.id,
      tenantId: user.tenant_id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  })
);

export default router;
