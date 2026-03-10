import dotenv from "dotenv";
import pg from "pg";

dotenv.config();

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  const tenantEmail = process.argv[2] || "admin@inka.local";

  const tenantResult = await pool.query(
    `SELECT tenant_id FROM users WHERE email = $1 LIMIT 1`,
    [tenantEmail.toLowerCase()]
  );
  if (!tenantResult.rowCount) {
    throw new Error(`User not found for email: ${tenantEmail}`);
  }
  const tenantId = tenantResult.rows[0].tenant_id;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Keep users/tenant for authentication; clear only business data.
    await client.query(`DELETE FROM activity_logs WHERE tenant_id = $1`, [tenantId]);
    await client.query(`DELETE FROM deliveries WHERE tenant_id = $1`, [tenantId]);
    await client.query(`DELETE FROM change_request_items WHERE tenant_id = $1`, [tenantId]);
    await client.query(`DELETE FROM change_requests WHERE tenant_id = $1`, [tenantId]);
    await client.query(`DELETE FROM project_bom_items WHERE tenant_id = $1`, [tenantId]);
    await client.query(
      `DELETE FROM project_engineers pe
       USING projects p
       WHERE pe.project_id = p.id AND p.tenant_id = $1`,
      [tenantId]
    );
    await client.query(`DELETE FROM projects WHERE tenant_id = $1`, [tenantId]);

    // Master data
    await client.query(`DELETE FROM items WHERE tenant_id = $1`, [tenantId]);
    await client.query(`DELETE FROM product_types WHERE tenant_id = $1`, [tenantId]);
    await client.query(`DELETE FROM brands WHERE tenant_id = $1`, [tenantId]);
    await client.query(`DELETE FROM categories WHERE tenant_id = $1`, [tenantId]);
    await client.query(`DELETE FROM clients WHERE tenant_id = $1`, [tenantId]);

    await client.query("COMMIT");
    console.log(`Cleaned tenant data for ${tenantEmail} (${tenantId}).`);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

main()
  .catch((err) => {
    console.error(err.message || err);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
  });

