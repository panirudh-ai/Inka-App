# INKA Blueprint Coverage Checklist

Date: 2026-03-03
Scope: strict verification against shared blueprint (philosophy, screen flow, DB mapping, constraints)

## Status Legend
- Implemented: fully present and wired
- Partial: present but not complete per blueprint detail
- Missing: not implemented

## 1) Core Principles Coverage

| Blueprint Requirement | Status | Evidence |
|---|---|---|
| Single Live BOM (no visible versioned BOM) | Implemented | `project_bom_items` live table in [schema.sql](../backend/src/db/schema.sql); delta CR model in [changeRequests.js](../backend/src/routes/changeRequests.js) |
| Live BOM cannot be edited directly | Implemented | `POST /api/projects/:projectId/bom-items` blocked with 403 in [projects.js](../backend/src/routes/projects.js) |
| Structured hierarchy selection (Category->Product Type->Brand->Model->Qty) | Implemented | [HierarchySelector.jsx](../frontend/src/components/HierarchySelector.jsx), PM/CR flows in [ProjectManagerView.jsx](../frontend/src/pages/ProjectManagerView.jsx) |
| Admin-only structure control | Implemented | `/api/admin/*` guarded by admin-only middleware in [masterData.js](../backend/src/routes/masterData.js) |
| One open CR per project | Implemented | partial unique index `ux_single_open_cr_per_project` in [schema.sql](../backend/src/db/schema.sql) + route check in [changeRequests.js](../backend/src/routes/changeRequests.js) |
| Delta-based CR apply (add/modify/delete) transaction | Implemented | Approval transaction in [changeRequests.js](../backend/src/routes/changeRequests.js) |
| Delivery intelligence (approved/delivered/balance) | Implemented | delivery validation/update in [deliveries.js](../backend/src/routes/deliveries.js), summary in [projects.js](../backend/src/routes/projects.js) |
| Immutable activity log | Implemented | `activity_logs` table in [schema.sql](../backend/src/db/schema.sql), logging in routes/services |
| Category sequence unlock mode | Implemented | `category_sequence_mode` field + effective-scope validation in [changeRequests.js](../backend/src/routes/changeRequests.js) |
| Engineers cannot see draft CR | Implemented | engineer has no CR endpoints access; activity hides CR entities in [activity.js](../backend/src/routes/activity.js) |
| Same model cannot duplicate in project BOM | Implemented | `UNIQUE(project_id, item_id)` in [schema.sql](../backend/src/db/schema.sql) |
| Delivered <= Approved | Implemented | DB check in [schema.sql](../backend/src/db/schema.sql) + service validation in [deliveries.js](../backend/src/routes/deliveries.js) |

## 2) UI Screen-by-Screen Coverage

### Admin Web App

| Screen/Feature | Status | Evidence |
|---|---|---|
| Dashboard KPIs (projects/open CR/categories/item master) | Implemented | [AdminView.jsx](../frontend/src/pages/AdminView.jsx) |
| Master Data: Categories (list/add/edit/active) | Implemented | [AdminView.jsx](../frontend/src/pages/AdminView.jsx), [masterData.js](../backend/src/routes/masterData.js) |
| Product Types (list/filter/add/edit/active) | Implemented | same as above |
| Brands (list/add/edit/active) | Implemented | same as above |
| Models/Item Master (list/filter/add/edit/active) | Implemented | same as above |
| Users & Roles management | Implemented | Admin tab in [AdminView.jsx](../frontend/src/pages/AdminView.jsx), endpoints in [masterData.js](../backend/src/routes/masterData.js) |
| Left sidebar with Projects/Reports/Settings navigation | Partial | functional tabs exist, but full left-sidebar IA not implemented |

### Project Manager / Approver Web App

| Screen/Feature | Status | Evidence |
|---|---|---|
| Project list (Open CR + Last activity) | Implemented | [ProjectManagerView.jsx](../frontend/src/pages/ProjectManagerView.jsx), `/api/projects` in [projects.js](../backend/src/routes/projects.js) |
| Create project form (name/client/location/start date/engineers/sequence mode) | Implemented | same |
| Project dashboard header financial summary | Implemented | same + [projects.js](../backend/src/routes/projects.js) |
| BOM tab grouped by category/system | Implemented | [ProjectManagerView.jsx](../frontend/src/pages/ProjectManagerView.jsx) |
| Add item structured flow | Implemented | via CR add flow using [HierarchySelector.jsx](../frontend/src/components/HierarchySelector.jsx) |
| Duplicate-model handling | Implemented | CR add blocks existing live model in [changeRequests.js](../backend/src/routes/changeRequests.js) |
| Change Request tab (create/edit/submit/approve/reject) | Implemented | PM + approver controls in [ProjectManagerView.jsx](../frontend/src/pages/ProjectManagerView.jsx) |
| Diff panel (before/after) | Implemented | `/api/change-requests/:crId/diff` + table UI |
| Scope impact summary | Implemented | qty/value summary in diff API [changeRequests.js](../backend/src/routes/changeRequests.js) |
| Deliveries tab with validation | Implemented | hierarchy selector + balance chips + backend checks |
| Delivery columns incl photo/notes/engineer/date | Implemented | [ProjectManagerView.jsx](../frontend/src/pages/ProjectManagerView.jsx), [deliveries.js](../backend/src/routes/deliveries.js) |
| Activity feed detailed | Implemented | metadata rendered in PM activity tab |

### Engineer Mobile App

| Screen/Feature | Status | Evidence |
|---|---|---|
| Role-based login | Implemented | [LoginView.jsx](../frontend/src/pages/LoginView.jsx), [auth.js](../backend/src/routes/auth.js) |
| Mobile BOM view grouped by system | Implemented | [EngineerView.jsx](../frontend/src/pages/EngineerView.jsx) |
| Status dropdown full lifecycle values | Implemented | [EngineerView.jsx](../frontend/src/pages/EngineerView.jsx), [projects.js](../backend/src/routes/projects.js) |
| Delivery quick add | Implemented | [EngineerView.jsx](../frontend/src/pages/EngineerView.jsx) |
| Photo upload + notes | Implemented | upload flow wired to `/api/uploads/photo` |
| Offline queue & sync | Implemented | local queue + auto retry + online event in [EngineerView.jsx](../frontend/src/pages/EngineerView.jsx) |
| Conflict handling | Implemented | retry/discard UI in engineer activity tab |

### Client Portal (Future)

| Screen/Feature | Status | Evidence |
|---|---|---|
| Read-only approved BOM/progress/activity | Implemented | [ClientView.jsx](../frontend/src/pages/ClientView.jsx), role access in routes |
| Download PDF report | Implemented | [reports.js](../backend/src/routes/reports.js), client download button |

## 3) Database-to-Screen Mapping Coverage

### Core table presence
All requested core tables are present in [schema.sql](../backend/src/db/schema.sql):
- `projects`
- `categories`
- `product_types`
- `brands`
- `items`
- `project_bom_items`
- `change_requests`
- `change_request_items`
- `deliveries`
- `activity_logs`
- `users`

### Field mapping highlights

| Mapping Area | Status | Notes |
|---|---|---|
| Category fields (`name`,`sequence_order`,`is_active`,`tenant_id`) | Implemented | CRUD/admin UI + DB |
| Product type category-filtered mapping | Implemented | DB FK + API filter + UI dropdown |
| Brand mapping with active toggle | Implemented | DB/API/UI |
| Items model-level mapping incl `specifications` JSON | Partial | DB/API support full; UI create uses default empty JSON, no rich JSON editor panel |
| Project list mapping (`open CR`, `last activity`) | Implemented | Derived in `/api/projects` |
| Dashboard financial derived fields | Implemented | `/api/projects/:id/dashboard` |
| BOM mapping (category/type/brand/model/qty/rate/delivered/balance/status) | Implemented | joined dashboard query + UI render |
| CR mapping (`created_by`,`approved_by`,`approved_at`,`change_request_items`) | Implemented | API + UI actions |
| Deliveries mapping (`logged_by`,`created_at`,`notes`,`photo_url`) | Implemented | API + UI |
| Activity mapping (`action_type`,`entity`,`metadata_json`) | Implemented | API + UI |
| User/role mapping | Implemented | auth + admin users tab |

## 4) Constraint & Governance Verification

| Rule | Status | Evidence |
|---|---|---|
| Only one open CR | Implemented | partial unique index + route guard |
| No duplicate model in project BOM | Implemented | unique `(project_id,item_id)` |
| Delivered <= Approved | Implemented | DB check + transactional validation |
| Structure admin-only | Implemented | admin route guard |
| CR-only scope changes | Implemented | direct BOM edit blocked; CR endpoints enforced |

## 5) API Coverage Snapshot

Implemented endpoint groups:
- Auth: `/api/auth/login`, `/api/auth/me`
- Reference read: `/api/reference/users|categories|product-types|brands|items`
- Admin master + users: `/api/admin/*`
- Projects: `/api/projects`, `/api/projects/:id/dashboard`, status patch
- CR: create/list/items/submit/approve/reject/diff
- Deliveries: list/create
- Activity: list
- Uploads: `/api/uploads/photo`
- Reports: `/api/projects/:projectId/report.pdf`

## 6) Residual Gaps (strictly tracked)

1. **Native mobile app package**: Missing.
- Current implementation is a PWA/mobile web app, installable but not native Android/iOS binary.

2. **Optimistic locking tokens/version columns**: Partial.
- Transactional controls exist, but explicit version-column based optimistic locking contract is not present.

3. **Admin IA exact left-sidebar modules (Reports/Settings pages)**: Partial.
- Functional tabs and data modules exist; dedicated standalone Reports/Settings screens are not yet built.

4. **Item specifications JSON panel (rich editor)**: Partial.
- `specifications` is fully supported in DB/API; UI currently writes default JSON and lacks dedicated JSON editor panel.

## 7) Conclusion

Overall result: **Implemented with minor residual gaps**.
- Governance engine core and critical constraints are in place.
- PM, Engineer, Admin, and Client role flows are functional end-to-end.
- Remaining items are mostly UX/deployment polish (native app packaging, dedicated settings/report modules, richer JSON editor, explicit optimistic-lock contract).
