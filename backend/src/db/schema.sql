CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  password_hash TEXT NOT NULL DEFAULT crypt('ChangeMe123', gen_salt('bf')),
  role TEXT NOT NULL CHECK (role IN ('admin', 'project_manager', 'engineer', 'client')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, email)
);

ALTER TABLE users
ADD COLUMN IF NOT EXISTS password_hash TEXT NOT NULL DEFAULT crypt('ChangeMe123', gen_salt('bf'));

UPDATE users
SET role = 'project_manager'
WHERE role = 'approver';

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users
ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'project_manager', 'engineer', 'client'));

CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sequence_order INT NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  row_version INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, name)
);

CREATE TABLE IF NOT EXISTS product_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  row_version INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, category_id, name)
);

CREATE TABLE IF NOT EXISTS brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  row_version INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, name)
);

CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  location TEXT,
  primary_contact_name TEXT,
  primary_contact_phone TEXT,
  primary_contact_email TEXT,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  row_version INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, name)
);

CREATE TABLE IF NOT EXISTS items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  product_type_id UUID NOT NULL REFERENCES product_types(id) ON DELETE RESTRICT,
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE RESTRICT,
  model_number TEXT NOT NULL,
  full_name TEXT NOT NULL,
  unit_of_measure TEXT NOT NULL,
  default_rate NUMERIC(14,2) NOT NULL DEFAULT 0,
  specifications JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  row_version INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, category_id, product_type_id, brand_id, model_number)
);

CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  client_name TEXT NOT NULL,
  location TEXT NOT NULL,
  drive_link TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'on_hold', 'completed')),
  start_date DATE,
  category_sequence_mode BOOLEAN NOT NULL DEFAULT FALSE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  row_version INT NOT NULL DEFAULT 1,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE projects
ADD COLUMN IF NOT EXISTS drive_link TEXT;
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS project_engineers (
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (project_id, user_id)
);

CREATE TABLE IF NOT EXISTS project_clients (
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (project_id, user_id)
);

CREATE TABLE IF NOT EXISTS project_bom_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE RESTRICT,
  quantity NUMERIC(14,2) NOT NULL CHECK (quantity >= 0),
  rate NUMERIC(14,2) NOT NULL CHECK (rate >= 0),
  delivered_quantity NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (delivered_quantity >= 0),
  floor_label TEXT NOT NULL DEFAULT 'Unassigned',
  location_description TEXT,
  status TEXT NOT NULL DEFAULT 'Work Yet to Start',
  row_version INT NOT NULL DEFAULT 1,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (project_id, item_id),
  CHECK (delivered_quantity <= quantity)
);

CREATE TABLE IF NOT EXISTS change_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('draft', 'pending', 'approved', 'rejected')),
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  row_version INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_single_open_cr_per_project
ON change_requests(project_id)
WHERE status IN ('draft', 'pending');

CREATE TABLE IF NOT EXISTS change_request_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  change_request_id UUID NOT NULL REFERENCES change_requests(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE RESTRICT,
  change_type TEXT NOT NULL CHECK (change_type IN ('add', 'modify', 'delete')),
  old_quantity NUMERIC(14,2),
  new_quantity NUMERIC(14,2),
  floor_label TEXT,
  location_description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE project_bom_items ADD COLUMN IF NOT EXISTS floor_label TEXT NOT NULL DEFAULT 'Unassigned';
ALTER TABLE project_bom_items ADD COLUMN IF NOT EXISTS location_description TEXT;
ALTER TABLE change_request_items ADD COLUMN IF NOT EXISTS floor_label TEXT;
ALTER TABLE change_request_items ADD COLUMN IF NOT EXISTS location_description TEXT;

CREATE TABLE IF NOT EXISTS project_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  role_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (project_id, role_name, contact_name)
);

CREATE TABLE IF NOT EXISTS project_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  engineer_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  visit_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE RESTRICT,
  quantity NUMERIC(14,2) NOT NULL CHECK (quantity > 0),
  notes TEXT,
  photo_url TEXT,
  row_version INT NOT NULL DEFAULT 1,
  logged_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE categories ADD COLUMN IF NOT EXISTS row_version INT NOT NULL DEFAULT 1;
ALTER TABLE product_types ADD COLUMN IF NOT EXISTS row_version INT NOT NULL DEFAULT 1;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS row_version INT NOT NULL DEFAULT 1;
ALTER TABLE items ADD COLUMN IF NOT EXISTS row_version INT NOT NULL DEFAULT 1;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS row_version INT NOT NULL DEFAULT 1;
ALTER TABLE project_bom_items ADD COLUMN IF NOT EXISTS row_version INT NOT NULL DEFAULT 1;
ALTER TABLE change_requests ADD COLUMN IF NOT EXISTS row_version INT NOT NULL DEFAULT 1;
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS row_version INT NOT NULL DEFAULT 1;

CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_items_tenant_category_pt_brand ON items(tenant_id, category_id, product_type_id, brand_id);
CREATE INDEX IF NOT EXISTS ix_clients_tenant_name ON clients(tenant_id, name);
CREATE INDEX IF NOT EXISTS ix_bom_project ON project_bom_items(project_id);
CREATE INDEX IF NOT EXISTS ix_deliveries_project ON deliveries(project_id);
CREATE INDEX IF NOT EXISTS ix_activity_project_created_at ON activity_logs(project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ix_project_contacts_project ON project_contacts(project_id);
CREATE INDEX IF NOT EXISTS ix_project_visits_project_created ON project_visits(project_id, created_at DESC);
