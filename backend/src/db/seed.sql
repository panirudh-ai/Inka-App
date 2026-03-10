BEGIN;

INSERT INTO tenants (id, name)
VALUES ('00000000-0000-0000-0000-000000000001', 'INKA Default Tenant')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

DELETE FROM users
WHERE tenant_id = '00000000-0000-0000-0000-000000000001'
  AND (role = 'approver' OR email = 'approver@inka.local');

INSERT INTO users (id, tenant_id, name, email, password_hash, role, is_active)
VALUES
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Admin User', 'admin@inka.local', crypt('Inka@123', gen_salt('bf')), 'admin', TRUE),
  ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Project Manager', 'pm@inka.local', crypt('Inka@123', gen_salt('bf')), 'project_manager', TRUE),
  ('00000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'Engineer User', 'engineer@inka.local', crypt('Inka@123', gen_salt('bf')), 'engineer', TRUE),
  ('00000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', 'Client User', 'client@inka.local', crypt('Inka@123', gen_salt('bf')), 'client', TRUE)
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name,
    email = EXCLUDED.email,
    password_hash = EXCLUDED.password_hash,
    role = EXCLUDED.role,
    is_active = EXCLUDED.is_active;

COMMIT;
