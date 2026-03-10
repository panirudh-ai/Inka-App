import { pool } from "../db/pool.js";
import { verifyAuthToken } from "../services/jwt.js";

const OPEN_PATHS = new Set(["/health", "/api/auth/login", "/login"]);

export async function attachContext(req, _res, next) {
  if (OPEN_PATHS.has(req.path)) {
    return next();
  }

  const auth = req.header("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;

  if (token) {
    try {
      const decoded = verifyAuthToken(token);
      const userQuery = await pool.query(
        `SELECT id, tenant_id, role
         FROM users
         WHERE id = $1 AND tenant_id = $2 AND is_active = TRUE`,
        [decoded.userId, decoded.tenantId]
      );
      if (!userQuery.rowCount) {
        const err = new Error("Session invalid. Please login again.");
        err.status = 401;
        throw err;
      }
      const user = userQuery.rows[0];
      req.ctx = {
        tenantId: user.tenant_id,
        userId: user.id,
        role: user.role,
      };
      return next();
    } catch (e) {
      if (e?.status) {
        return next(e);
      }
      const err = new Error("Invalid or expired token");
      err.status = 401;
      return next(err);
    }
  }

  // Backward-compatible header fallback for local testing
  const tenantId = req.header("x-tenant-id");
  const userId = req.header("x-user-id");
  const roleHint = req.header("x-role") || null;

  if (!tenantId || !userId) {
    const err = new Error("Unauthorized. Login required.");
    err.status = 401;
    return next(err);
  }

  const userQuery = await pool.query(
    `SELECT id, role FROM users WHERE id = $1 AND tenant_id = $2 AND is_active = TRUE`,
    [userId, tenantId]
  );
  if (!userQuery.rowCount) {
    const err = new Error("Invalid user context");
    err.status = 401;
    return next(err);
  }

  // Never trust x-role from client. Keep DB role as source of truth.
  req.ctx = { tenantId, userId, role: userQuery.rows[0].role, roleHint };
  return next();
}

export function requireRoles(...allowed) {
  return function roleGuard(req, _res, next) {
    if (!req.ctx || !allowed.includes(req.ctx.role)) {
      const err = new Error("Insufficient role permissions");
      err.status = 403;
      return next(err);
    }
    return next();
  };
}
