# INKA Casa Intelligente — Project Management App

A full-stack, multi-tenant project management system for smart home / interiors businesses.
Manages projects end-to-end: BOM, deliveries, change requests, site visits, clients, and reporting.

---

## Table of Contents

1. [Tech Stack](#1-tech-stack)
2. [Project Structure](#2-project-structure)
3. [Database Schema](#3-database-schema)
4. [Authentication & Authorization Flow](#4-authentication--authorization-flow)
5. [Role-Based Access](#5-role-based-access)
6. [End-to-End App Flows](#6-end-to-end-app-flows)
   - 6.1 [Login Flow](#61-login-flow)
   - 6.2 [Admin Flow](#62-admin-flow)
   - 6.3 [Project Manager Flow](#63-project-manager-flow)
   - 6.4 [Change Request Workflow](#64-change-request-workflow)
   - 6.5 [Engineer Flow](#65-engineer-flow)
   - 6.6 [Client Portal Flow](#66-client-portal-flow)
   - 6.7 [Delivery Flow](#67-delivery-flow)
   - 6.8 [PDF Report Flow](#68-pdf-report-flow)
   - 6.9 [Excel Import Flow](#69-excel-import-flow)
   - 6.10 [Google Drive Flow](#610-google-drive-flow)
   - 6.11 [Offline Queue Flow (Engineer)](#611-offline-queue-flow-engineer)
7. [Frontend Components & Pages](#7-frontend-components--pages)
8. [Backend Routes Reference](#8-backend-routes-reference)
9. [Backend Services & Utilities](#9-backend-services--utilities)
10. [All npm Packages Used](#10-all-npm-packages-used)
11. [Environment Variables](#11-environment-variables)
12. [First-Time Setup](#12-first-time-setup)
13. [Deployment Guide](#13-deployment-guide)

---

## 1. Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend Framework | React 18 |
| Frontend Build | Vite 5 |
| UI Component Library | Material UI (MUI) v6 |
| CSS-in-JS | Emotion (`@emotion/react`, `@emotion/styled`) |
| Utility CSS | Tailwind CSS v3 (preflight disabled — MUI-safe) |
| Unstyled Primitives | Ark UI (`@ark-ui/react`) |
| Icons | MUI Icons + Lucide React |
| HTTP Client | Axios |
| Backend Framework | Express.js (Node.js, ES modules) |
| Database | PostgreSQL (with pgcrypto extension) |
| Auth | JWT (`jsonwebtoken`) |
| Validation | Zod |
| File Uploads | Multer |
| PDF Generation | PDFKit |
| Excel Parsing | XLSX |
| Cloud Storage | Google Drive API (`googleapis`) |
| Environment Config | Dotenv |
| Deployment | Render (backend) + Vercel (frontend) + Neon (PostgreSQL) |

---

## 2. Project Structure

```
Inka-App/
├── backend/
│   ├── src/
│   │   ├── index.js                  # Express server entry point
│   │   ├── config/
│   │   │   └── env.js                # Environment variable validation
│   │   ├── db/
│   │   │   ├── pool.js               # PostgreSQL connection pool + withTransaction()
│   │   │   ├── schema.sql            # Full DB schema (run once)
│   │   │   └── seed.sql              # Demo seed data
│   │   ├── middleware/
│   │   │   ├── auth.js               # JWT extraction + requireRoles() guard
│   │   │   └── error.js              # Global error handler (maps PG error codes)
│   │   ├── routes/
│   │   │   ├── auth.js               # POST /login, GET /me
│   │   │   ├── masterData.js         # Admin: categories, users, brands, items
│   │   │   ├── reference.js          # Read-only reference data (all roles)
│   │   │   ├── clients.js            # Client master CRUD
│   │   │   ├── projects.js           # Project CRUD + dashboard + visits + contacts
│   │   │   ├── changeRequests.js     # CR workflow (create → submit → approve/reject)
│   │   │   ├── deliveries.js         # Delivery logging
│   │   │   ├── activity.js           # Audit trail queries
│   │   │   ├── uploads.js            # Photo upload, Drive upload, Excel import
│   │   │   └── reports.js            # PDF report generation
│   │   └── services/
│   │       ├── jwt.js                # signAuthToken, verifyAuthToken
│   │       ├── validation.js         # Zod wrapper with HTTP error mapping
│   │       ├── pagination.js         # parsePagination, asPaginated helpers
│   │       ├── asyncHandler.js       # Wraps async route handlers
│   │       ├── activity.js           # logActivity() helper
│   │       └── googleDrive.js        # Google Drive upload & folder creation
│   └── package.json
├── frontend/
│   ├── public/
│   │   ├── logo.png                  # App logo (used in login + browser tab)
│   │   ├── inka-logo.svg             # SVG fallback logo
│   │   ├── manifest.webmanifest      # PWA manifest
│   │   └── sw.js                     # Service worker
│   ├── src/
│   │   ├── main.jsx                  # ReactDOM.createRoot entry + font imports
│   │   ├── App.jsx                   # Root: reads localStorage role → routes to view
│   │   ├── theme.js                  # MUI createTheme (dark/light, colors, overrides)
│   │   ├── park.css                  # @tailwind components + utilities
│   │   ├── api/
│   │   │   └── client.js             # Axios instance, auth header injection, safeGet()
│   │   ├── pages/
│   │   │   ├── LoginView.jsx         # Login page with animated card
│   │   │   ├── AdminView.jsx         # Admin dashboard (master data + users + projects)
│   │   │   ├── ProjectManagerView.jsx # PM workspace (BOM, CR, deliveries, files)
│   │   │   ├── EngineerView.jsx      # Engineer workspace (status updates, deliveries)
│   │   │   └── ClientView.jsx        # Client read-only portal
│   │   └── components/
│   │       ├── AnimatedBackground.jsx # Floating gradient orbs + film grain overlay
│   │       ├── AppToast.jsx           # Tailwind-styled toast notifications
│   │       ├── HierarchySelector.jsx  # Category → ProductType → Brand → Item picker
│   │       ├── KpiCard.jsx            # KPI summary card (icon + value + label)
│   │       └── StatusTag.jsx          # Tailwind pill badge for status labels
│   ├── index.html                    # App shell + favicon + PWA meta
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── postcss.config.js
├── scripts/
│   └── import-excel.ps1              # PowerShell script to import Excel to production
├── render.yaml                       # Render.com deployment config
└── package.json                      # Root convenience (bootstrap both)
```

---

## 3. Database Schema

All tables include `tenant_id` for multi-tenant isolation.

```
tenants
  └── id, name, created_at

users
  └── id, tenant_id, name, email, password_hash (pgcrypto bcrypt), role, is_active
      Roles: admin | project_manager | engineer | client

categories
  └── id, tenant_id, name, sequence_order, is_active

product_types
  └── id, category_id, name, is_active

brands
  └── id, tenant_id, name, is_active

items  (the model / product master)
  └── id, category_id, product_type_id, brand_id, model_number, full_name,
      default_rate, specifications

clients  (company/person master)
  └── id, tenant_id, name, location, contact_name, phone, email

projects
  └── id, tenant_id, name, client_id, location, status, drive_link,
      category_sequence_mode (boolean)

project_engineers       (many-to-many: project ↔ users with role=engineer)
project_clients         (many-to-many: project ↔ users with role=client)

project_bom_items
  └── id, project_id, item_id, quantity, delivered_quantity, rate,
      status, floor_label, row_version

change_requests
  └── id, project_id, status (draft|pending|approved|rejected),
      created_by, approved_by

change_request_items
  └── id, change_request_id, item_id, change_type (add|modify|delete),
      quantity, prev_quantity

deliveries
  └── id, project_id, item_id, quantity, logged_by, notes, photo_url, created_at

project_contacts
  └── id, project_id, role_name, contact_name, phone, email

project_visits
  └── id, project_id, engineer_id, visit_date, notes

activity_logs
  └── id, tenant_id, project_id, user_id, action_type, entity_type,
      metadata_json, created_at
```

**Key design decisions:**
- `row_version` on `project_bom_items` enables optimistic concurrency (engineer conflict detection)
- Passwords use PostgreSQL `crypt(password, gen_salt('bf'))` — no app-layer hashing library needed
- `category_sequence_mode` controls whether CR items must follow category `sequence_order`

---

## 4. Authentication & Authorization Flow

```
User enters email + password
        │
        ▼
POST /api/auth/login
  ├── SELECT user WHERE email = $1 AND tenant_id = $2
  ├── crypt(input_password, stored_hash) = stored_hash  (pgcrypto verify)
  ├── If match → signAuthToken({ tenantId, userId, role })
  └── Return { token, user }
        │
        ▼
Frontend stores token in localStorage ("inka_auth")
        │
        ▼
Every API request
  ├── Axios interceptor adds: Authorization: Bearer <token>
  ├── auth.js middleware: verifyAuthToken(token) → attaches req.context
  └── requireRoles(...allowed) guard checks req.context.role
```

Token payload:
```json
{ "tenantId": 1, "userId": 5, "role": "project_manager", "iat": ..., "exp": ... }
```

---

## 5. Role-Based Access

| Feature | admin | project_manager | engineer | client |
|---------|:-----:|:---------------:|:--------:|:------:|
| Master data (categories, brands, items) | ✓ | — | — | — |
| User management | ✓ | — | — | — |
| Create / delete projects | ✓ | ✓ | — | — |
| BOM management | ✓ | ✓ | — | — |
| Change requests | ✓ | ✓ | — | — |
| Client management | ✓ | ✓ | — | — |
| Log deliveries | ✓ | ✓ | ✓ | — |
| Update BOM item status | — | — | ✓ | — |
| Log site visits | — | — | ✓ | — |
| View assigned projects | ✓ | ✓ | ✓ (own) | ✓ (own) |
| Download PDF report | ✓ | ✓ | — | ✓ |
| View activity log | ✓ | ✓ | ✓ | ✓ (filtered) |
| Google Drive upload | — | ✓ | — | — |

---

## 6. End-to-End App Flows

### 6.1 Login Flow

```
1. User opens app → LoginView.jsx
2. Enters email + password → clicks Login
3. POST /api/auth/login
4. On success: token + user object saved to localStorage ("inka_auth")
5. App.jsx reads role from stored user
6. Routes to correct view:
   - admin         → AdminView
   - project_manager → ProjectManagerView
   - engineer      → EngineerView
   - client        → ClientView
7. Logout: clears localStorage → back to LoginView
```

### 6.2 Admin Flow

```
AdminView tabs:
├── Dashboard (viewMode = "dashboard")
│     └── Recent activity log (GET /api/admin/activity/recent)
│
├── Projects tab
│     ├── Search + paginated list (PAGE_SIZE = 10)
│     ├── Expand project accordion → view BOM items
│     ├── Create new project form (POST /api/projects)
│     └── Delete project
│
├── Clients tab
│     ├── Search + paginated list
│     ├── Add / edit / delete client records
│     └── GET/POST/PATCH/DELETE /api/clients
│
├── Users & Roles tab
│     ├── Search + paginated user list
│     ├── Add user (name, email, role, password)
│     ├── Inline edit (name, email, password)
│     ├── Toggle active/inactive
│     └── PATCH /api/admin/users/:id
│
├── Categories tab
│     ├── List categories with sequence order
│     ├── Add / edit / delete category
│     └── Manage product types per category
│
├── Brands tab
│     ├── Vertical list with pagination (10/page)
│     ├── Search resets to page 1
│     └── Add / edit / deactivate brand
│
└── Models (Items) tab
      ├── Paginated list (10/page)
      ├── Filter by category / brand
      ├── HierarchySelector for adding new item
      └── Add / edit / deactivate item
```

### 6.3 Project Manager Flow

```
ProjectManagerView:
├── Left panel: project list (paginated, searchable)
│     └── Select project → loads full dashboard
│
├── Dashboard tab
│     ├── KPI cards (total items, delivered %, pending CRs)
│     ├── Project details (client, location, status, drive link)
│     └── Contacts section (editable)
│
├── BOM tab
│     ├── View all BOM items grouped by floor/location
│     ├── Add item via HierarchySelector
│     ├── Edit quantity / rate
│     ├── Delete item (if not delivered)
│     └── BOM status badges
│
├── Change Requests tab
│     └── See section 6.4 (Change Request Workflow)
│
├── Deliveries tab
│     ├── Paginated delivery log
│     ├── Log delivery: select item → enter qty, notes → optional photo upload
│     └── Edit / delete delivery entry
│
├── Engineers tab
│     ├── Assign / remove engineers from project
│     └── GET/POST /api/projects/:id/engineers
│
├── Site Visits tab
│     ├── View visit history and summary stats
│     └── Log new visit (date, notes)
│
├── Files tab (Google Drive)
│     ├── List files in project Drive folder
│     ├── Upload file → creates Drive folder if needed
│     └── Open file link in new tab
│
├── Activity tab
│     └── Full audit trail for this project
│
└── Reports
      └── Download PDF (GET /api/projects/:id/report.pdf)
```

### 6.4 Change Request Workflow

```
State machine:  draft → pending → approved
                              └→ rejected (back to draft)

1. PM creates new CR
   POST /api/projects/:projectId/change-requests
   Status = "draft"

2. PM adds items to CR
   POST /api/change-requests/:crId/items
   change_type: "add" | "modify" | "delete"

   Validations:
   ├── add: item must NOT already be in BOM
   ├── modify: new qty must be ≥ delivered_quantity
   ├── delete: delivered_quantity must be 0
   └── category_sequence_mode: items must respect category sequence_order

3. PM reviews CR diff
   GET /api/change-requests/:crId/diff
   Returns: before/after view of each changed item

4. PM submits CR
   POST /api/change-requests/:crId/submit
   Status: draft → pending

5. PM approves CR (same PM can approve in this version)
   POST /api/change-requests/:crId/approve
   ├── Opens DB transaction
   ├── For each CR item:
   │     add    → INSERT into project_bom_items
   │     modify → UPDATE quantity in project_bom_items
   │     delete → DELETE from project_bom_items
   ├── Status: pending → approved
   └── Logs activity entry

   OR PM rejects:
   POST /api/change-requests/:crId/reject
   Status: pending → rejected
```

### 6.5 Engineer Flow

```
EngineerView:
├── Project list (only assigned projects via project_engineers table)
│
├── Select project → tabs:
│
├── BOM tab
│     ├── Items grouped by floor/location
│     ├── Search by item name
│     ├── Update item status via dropdown (11 statuses):
│     │     Work Yet to Start → Position Marked → Piping Done →
│     │     Wiring Done → Device Fixed → Testing Done →
│     │     Installed - Working → Installed - Snagged →
│     │     Snagged - Cleared → Commissioned → On Hold
│     └── Optimistic update with row_version conflict detection
│
├── Deliveries tab
│     ├── Log delivery: item → quantity → notes → photo
│     └── Upload photo (POST /api/uploads/photo → returns URL)
│
├── Visits tab
│     ├── View past visits
│     └── Log site visit (date + notes)
│
└── Activity tab
      └── Project audit trail
```

### 6.6 Client Portal Flow

```
ClientView (read-only):
├── Project list (only projects where client is assigned)
│
├── Select project → tabs:
│
├── Overview tab
│     ├── Project info (name, location, status)
│     └── Contact details
│
├── BOM tab
│     ├── Items grouped by floor/location
│     ├── Delivery progress per item (delivered / total)
│     └── Status badges (no edit allowed)
│
├── Deliveries tab
│     └── Delivery history (date, item, qty, photo link)
│
├── Files tab
│     └── Google Drive files for this project (open link)
│
├── Activity tab
│     └── Filtered activity (no CR internals shown)
│
└── Download Report
      └── GET /api/projects/:id/report.pdf (no financial data)
```

### 6.7 Delivery Flow

```
Engineer or PM logs delivery:

1. Select project BOM item
2. Enter quantity delivered
3. (Optional) Add notes
4. (Optional) Upload photo
   └── POST /api/uploads/photo
       ├── Multer saves to ./uploads/
       └── Returns { url: "/uploads/filename.jpg" }

5. POST /api/projects/:projectId/deliveries
   { itemId, quantity, notes, photoUrl }

   Backend:
   ├── Locks BOM item row (SELECT ... FOR UPDATE)
   ├── Checks: delivered_qty + new_qty ≤ approved_qty
   ├── Updates project_bom_items.delivered_quantity
   ├── Inserts delivery record
   └── Logs activity entry
```

### 6.8 PDF Report Flow

```
PM or Client clicks "Download Report":

1. GET /api/projects/:projectId/report.pdf
   (Authorization: Bearer token required)

2. Backend (reports.js):
   ├── Fetches project info
   ├── Fetches BOM items with delivery progress
   ├── Fetches site visit summary
   └── Builds PDF using PDFKit:
       ├── Header (project name, client, date)
       ├── BOM table (item, qty, delivered, status)
       ├── Site visit summary
       └── NO financial/price data (shareable with clients)

3. Response: PDF binary stream
   Content-Type: application/pdf
   Content-Disposition: attachment; filename="report.pdf"
```

### 6.9 Excel Import Flow

```
PM uploads Excel file:

1. POST /api/uploads/excel-import (multipart/form-data)
2. Multer receives file → XLSX parses sheets

Sheet structure expected:
├── "Categories"    → name, sequence_order
├── "Brands"        → name
├── "Items"         → category, product_type, brand, model_number,
│                     full_name, default_rate, specifications
└── "Projects"      → project_name, client_name, engineer_email,
                      bom items with quantities

Backend processing:
├── Auto-creates missing categories, product types, brands
├── Auto-creates or links items
├── Creates project with BOM
├── Assigns engineer to project
└── Returns import summary { created, errors }
```

### 6.10 Google Drive Flow

```
PM uploads file to project Drive folder:

1. POST /api/uploads/drive (multipart/form-data)
   { file, projectId, projectName }

2. Backend (googleDrive.js):
   ├── Authenticates with Google service account
   ├── Checks if project folder exists in root Drive folder
   ├── Creates folder if not exists
   ├── Uploads file to project folder
   ├── Sets sharing: anyone with link can view (if GOOGLE_DRIVE_PUBLIC_LINKS=true)
   └── Returns { fileId, webViewLink, webContentLink }

3. GET /api/projects/:projectId/drive-files
   └── Lists files in project's Drive folder
```

### 6.11 Offline Queue Flow (Engineer)

```
Engineer loses connectivity:

1. Action attempted (status update / delivery)
2. Network request fails
3. Action serialized → pushed to localStorage queue ("inka_offline_queue")

On reconnect:
1. Network online event fires
2. Queue processor retries each queued action in order
3. Success → removes from queue
4. 409 Conflict → moves to conflict bucket ("inka_conflicts")
5. Engineer sees conflict items in UI
6. Engineer chooses: Retry (force) or Discard
```

---

## 7. Frontend Components & Pages

### Pages

| File | Purpose |
|------|---------|
| `LoginView.jsx` | Animated login form, logo, dark/light theme toggle |
| `AdminView.jsx` | Full admin panel: master data, users, projects, clients, activity |
| `ProjectManagerView.jsx` | PM workspace: BOM, CR, deliveries, files, visits, contacts |
| `EngineerView.jsx` | Engineer workspace: status updates, deliveries, visits |
| `ClientView.jsx` | Read-only client portal: BOM progress, deliveries, files, PDF |

### Reusable Components

| File | What it does |
|------|-------------|
| `AnimatedBackground.jsx` | Floating gradient orbs + SVG film grain texture overlay. Accepts `isDark` prop. Uses MUI `keyframes` for animation. |
| `AppToast.jsx` | Tailwind-styled toast notification. Props: `toast` `{ open, text, severity }` + `onClose`. Auto-dismisses in 2.5s. Replaces MUI Snackbar. |
| `HierarchySelector.jsx` | 4-step cascading selector: Category → Product Type → Brand → Item. Used when adding items to BOM or CR. |
| `KpiCard.jsx` | Summary card showing icon + numeric value + label. Used in dashboard views. Hidden on `viewMode === "dashboard"`. |
| `StatusTag.jsx` | Tailwind pill badge. Props: `label`, `color` (success/warning/error/info/primary/secondary/default), `size` (sm/md), `onDelete`. |

### Theme (`theme.js`)

- Dual mode: dark (`G8.black` background) and light (`G8.cream` background)
- Primary color: `G8.orange` (`#f59e0b` amber)
- Custom MUI component overrides (Button, Card, TextField, Chip, Table, etc.)
- Typography: Inter font (400/500/600/700 weights via `@fontsource/inter`)
- "Garden Eight" design token system

### API Client (`api/client.js`)

- Axios instance pointing to `VITE_API_BASE_URL`
- Request interceptor: reads `inka_auth` from localStorage → injects `Authorization` header
- `safeGet(url, fallback)` helper: returns `fallback` on 4xx/5xx instead of throwing

---

## 8. Backend Routes Reference

### Auth — `/api/auth`
| Method | Path | Access | Description |
|--------|------|--------|-------------|
| POST | `/login` | Public | Email/password login → JWT |
| GET | `/me` | Any auth | Current user info |

### Admin Master Data — `/api/admin`
| Method | Path | Description |
|--------|------|-------------|
| GET/POST | `/categories` | List / create categories |
| PATCH/DELETE | `/categories/:id` | Update / delete |
| GET/POST | `/product-types` | List / create product types |
| PATCH/DELETE | `/product-types/:id` | Update / delete |
| GET/POST | `/brands` | List / create brands |
| PATCH/DELETE | `/brands/:id` | Update / delete |
| GET/POST | `/items` | List / create items |
| PATCH/DELETE | `/items/:id` | Update / delete |
| GET/POST | `/users` | List / create users |
| PATCH/DELETE | `/users/:id` | Update / delete (supports password reset) |
| GET | `/activity/recent` | Recent activity across tenant |

### Reference Data — `/api/reference` (all authenticated roles)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/users` | Active users list |
| GET | `/categories` | Active categories |
| GET | `/product-types` | Active product types |
| GET | `/brands` | Active brands |
| GET | `/items` | Active items |

### Clients — `/api/clients`
| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Paginated client list |
| POST | `/` | Create client |
| PATCH | `/:id` | Update client |
| DELETE | `/:id` | Delete client |

### Projects — `/api/projects`
| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List projects (role-filtered) |
| POST | `/` | Create project |
| DELETE | `/:projectId` | Delete project |
| GET | `/:projectId/dashboard` | Full project data |
| GET/PUT | `/:projectId/contacts` | Project contact info |
| GET | `/:projectId/drive-files` | Google Drive file listing |
| PATCH | `/:projectId/bom-items/:bomItemId/status` | Update BOM item status |
| GET/POST | `/:projectId/visits` | Site visit history / log visit |
| GET | `/:projectId/visits/summary` | Visit statistics |

### Change Requests
| Method | Path | Description |
|--------|------|-------------|
| GET | `/projects/:projectId/change-requests` | List CRs |
| POST | `/projects/:projectId/change-requests` | Create CR |
| GET | `/change-requests/:crId/items` | CR line items |
| GET | `/change-requests/:crId/diff` | Before/after diff |
| POST | `/change-requests/:crId/items` | Add item to CR |
| DELETE | `/change-requests/:crId/items/:itemId` | Remove item |
| POST | `/change-requests/:crId/submit` | Submit for approval |
| POST | `/change-requests/:crId/approve` | Approve → applies to BOM |
| POST | `/change-requests/:crId/reject` | Reject CR |
| DELETE | `/change-requests/:crId` | Delete draft CR |

### Deliveries — `/api/projects/:projectId/deliveries`
| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Paginated deliveries |
| POST | `/` | Log delivery |
| PATCH | `/:deliveryId` | Edit delivery |
| DELETE | `/:deliveryId` | Delete delivery |

### Activity — `/api/projects/:projectId/activity`
| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Audit trail (filtered by role) |

### Uploads — `/api/uploads`
| Method | Path | Description |
|--------|------|-------------|
| POST | `/photo` | Upload delivery photo (disk) |
| POST | `/drive` | Upload file to Google Drive |
| POST | `/excel-import` | Bulk import from Excel |

### Reports
| Method | Path | Description |
|--------|------|-------------|
| GET | `/projects/:projectId/report.pdf` | Download PDF report |

---

## 9. Backend Services & Utilities

| File | Exports | Purpose |
|------|---------|---------|
| `services/jwt.js` | `signAuthToken`, `verifyAuthToken` | JWT sign/verify wrapper |
| `services/validation.js` | `validate(schema, data)` | Zod validation → HTTP 400 on failure |
| `services/pagination.js` | `parsePagination`, `asPaginated` | Parse query params, format response |
| `services/asyncHandler.js` | `asyncHandler(fn)` | Catches async errors → next(err) |
| `services/activity.js` | `logActivity(client, data)` | Insert into activity_logs |
| `services/googleDrive.js` | `uploadFile`, `listFiles` | Google Drive API integration |
| `db/pool.js` | `pool`, `withTransaction(fn)` | PG pool + ACID transaction wrapper |
| `middleware/auth.js` | `attachContext`, `requireRoles` | JWT auth + RBAC guards |
| `middleware/error.js` | default export | Global Express error handler |

---

## 10. All npm Packages Used

### Backend (`backend/package.json`)

| Package | Version | Purpose |
|---------|---------|---------|
| `express` | 4.19.2 | Web framework |
| `pg` | 8.13.1 | PostgreSQL client |
| `jsonwebtoken` | 9.0.2 | JWT auth tokens |
| `cors` | 2.8.5 | Cross-Origin Resource Sharing |
| `helmet` | 7.1.0 | Security HTTP headers |
| `morgan` | 1.10.0 | HTTP request logging |
| `multer` | 1.4.5-lts.1 | Multipart file upload handling |
| `pdfkit` | 0.15.1 | Server-side PDF generation |
| `xlsx` | 0.18.5 | Excel (.xlsx) file parsing |
| `googleapis` | 144.0.0 | Google Drive API integration |
| `dotenv` | 16.4.5 | `.env` file loading |
| `zod` | 3.23.8 | Runtime schema validation |

### Frontend (`frontend/package.json`)

| Package | Version | Purpose |
|---------|---------|---------|
| `react` | 18.3.1 | UI framework |
| `react-dom` | 18.3.1 | DOM rendering |
| `@mui/material` | 6.1.9 | Material UI components |
| `@mui/icons-material` | 6.1.9 | Material icon set |
| `@emotion/react` | — | CSS-in-JS runtime (MUI dependency) |
| `@emotion/styled` | — | Styled components (MUI dependency) |
| `axios` | 1.7.7 | HTTP client |
| `@ark-ui/react` | 5.34.1 | Headless/unstyled UI primitives |
| `lucide-react` | 0.577.0 | Icon library (used alongside MUI icons) |
| `tailwindcss` | 3.4.19 | Utility CSS (limited use, preflight disabled) |
| `postcss` | — | CSS processor (Tailwind dependency) |
| `autoprefixer` | — | Vendor prefix addition (PostCSS plugin) |
| `@fontsource/inter` | — | Inter font (self-hosted, no CDN) |
| `vite` | 5.4.10 | Build tool & dev server |
| `@vitejs/plugin-react` | — | Vite React plugin (JSX transform) |

---

## 11. Environment Variables

### Backend (`.env`)

```env
PORT=4000
DATABASE_URL=postgresql://user:password@host:5432/inka_db_v1
JWT_SECRET=your_secret_key_here
JWT_EXPIRES_IN=12h

# Google Drive (optional)
GOOGLE_DRIVE_ENABLED=false
GOOGLE_DRIVE_SERVICE_ACCOUNT_EMAIL=service@project.iam.gserviceaccount.com
GOOGLE_DRIVE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
GOOGLE_DRIVE_FOLDER_ID=1abc123DriveRootFolderId
GOOGLE_DRIVE_PUBLIC_LINKS=true
```

### Frontend (`.env`)

```env
VITE_API_BASE_URL=http://localhost:4000/api
```

---

## 12. First-Time Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 14+ with pgcrypto extension
- (Optional) Google Cloud service account for Drive integration

### 1. Database
```bash
createdb inka_db_v1
# pgcrypto is enabled inside schema.sql (CREATE EXTENSION IF NOT EXISTS pgcrypto)
```

### 2. Backend
```bash
cd backend
cp .env.example .env        # fill in DATABASE_URL, JWT_SECRET
npm install
npm run db:bootstrap        # runs schema.sql + seed.sql
npm run dev                 # starts on port 4000
```

### 3. Frontend
```bash
cd frontend
cp .env.example .env        # set VITE_API_BASE_URL=http://localhost:4000/api
npm install
npm run dev                 # starts on port 5173
```

### Seeded Demo Accounts (password: `Inka@123`)

| Email | Role |
|-------|------|
| `admin@inka.local` | admin |
| `pm@inka.local` | project_manager |
| `engineer@inka.local` | engineer |
| `client@inka.local` | client |

---

## 13. Deployment Guide

### Recommended Free-Tier Stack
- **Database**: [Neon](https://neon.tech) — Serverless PostgreSQL
- **Backend**: [Render](https://render.com) — Node.js web service
- **Frontend**: [Vercel](https://vercel.com) — Static SPA

### Step 1 — Neon Database
1. Create a free Neon project
2. Copy the connection string
3. Run schema: `psql <connection_string> -f backend/src/db/schema.sql`

### Step 2 — Render Backend
1. Push repo to GitHub
2. Render → New → Blueprint (picks up `render.yaml`)
3. Set env vars:
   - `DATABASE_URL` = Neon connection string
   - `JWT_SECRET` = strong random string
4. Render auto-runs `npm run db:schema` on deploy

### Step 3 — Vercel Frontend
1. Import repo in Vercel
2. Set root directory: `frontend`
3. Add env var:
   - `VITE_API_BASE_URL` = `https://<your-render-domain>/api`
4. Deploy

### Step 4 — Import Data (Optional)
```powershell
# Windows PowerShell
powershell -ExecutionPolicy Bypass -File scripts/import-excel.ps1 `
  -ApiBase https://<your-render-domain>/api `
  -Mode commit `
  -SummaryPath .\prod-import-summary.json
```

---

## Notes

- **Multi-tenancy**: All data is scoped by `tenant_id`. One deployment can serve multiple organizations.
- **PWA**: App is installable on mobile/desktop via `manifest.webmanifest` + service worker.
- **Tailwind + MUI coexistence**: Tailwind's `preflight` is disabled in `tailwind.config.js` to prevent CSS reset from breaking MUI component styles.
- **Password hashing**: Done entirely in PostgreSQL via `pgcrypto`. No bcrypt npm package needed on the Node side.
- **Category Sequence Mode**: Per-project flag. When enabled, CR items must be added in the order defined by `categories.sequence_order` — useful for formal contracts requiring structured change documentation.
- **Logo**: Place `logo.png` in `frontend/public/`. It is used as the login page logo and browser favicon. Uses `mix-blend-mode: multiply` to remove white background on light themes.
