# INKA Enterprise V1

React + Material UI + Node/Express + PostgreSQL (`inka_db_v1`).

## What is now implemented
- Real login (`/api/auth/login`) with JWT token
- Role-based authorization middleware (`admin`, `project_manager`, `approver`, `engineer`)
- Admin master-data screens with live CRUD:
  - Categories
  - Product Types
  - Brands
  - Models (Item Master)
- PM live screens:
  - Project select
  - Live BOM
  - Add BOM item (hierarchy flow)
  - Create CR, add CR deltas, submit CR
  - Deliveries + Activity feed
- Engineer live screens:
  - Project select
  - Item status update
  - Quick delivery logging
- Client portal:
  - Read-only project visibility
  - Approved BOM, delivery progress, activity history
  - PDF report via print/download action
- Delivery photo pipeline:
  - Upload photo endpoint `/api/uploads/photo`
  - PM/Engineer delivery forms can upload photos
- Offline-first skeleton:
  - Engineer actions queue in localStorage when offline
  - Auto retry every 10s on reconnect
  - Conflict bucket for 409 failures
  - Retry/discard conflict actions
- Installable app behavior (PWA):
  - manifest + service worker
  - install prompt button in app shell
- Server PDF reports:
  - endpoint `GET /api/projects/:projectId/report.pdf`
  - download from PM and Client screens

## First-time setup
1. Create DB: `inka_db_v1`
2. Backend:
   - `cd backend`
   - `npm install`
   - `npm run db:bootstrap`
   - `npm run dev`
3. Frontend:
   - `cd ../frontend`
   - `npm install`
   - `npm run dev`

## Demo Login (seeded)
Password for all users: `Inka@123`
- `admin@inka.local`
- `pm@inka.local`
- `approver@inka.local`
- `engineer@inka.local`
- `client@inka.local`

## Notes
- `npm run bootstrap` from root is optional convenience only.
- If DB already initialized, skip bootstrap and run only dev servers.

## Deploy (Free Tier)
Recommended stack:
- Frontend: Vercel
- Backend: Render
- DB: Neon Postgres

### 1) Create Neon Postgres
- Create a free Neon project + database.
- Copy connection string and set DB name to `inka_db_v1` (or use Neon default and keep URL as-is).

### 2) Deploy backend to Render
- Push this repo to GitHub.
- In Render: `New +` -> `Blueprint`.
- Select your repo (uses `render.yaml` from project root).
- After service is created, set env var:
  - `DATABASE_URL=<your_neon_connection_string>`
- Render runs `postDeployCommand: npm run db:schema` automatically.

### 3) Deploy frontend to Vercel
- Import repo in Vercel.
- Set root directory: `frontend`.
- Add env var:
  - `VITE_API_BASE_URL=https://<your-render-backend-domain>/api`
- Deploy.

### 4) Import Excel data to production API
From your local machine:
```powershell
powershell -ExecutionPolicy Bypass -File scripts/import-excel.ps1 -ApiBase https://<your-render-backend-domain>/api -Mode commit -SummaryPath .\prod-import-summary.json
```
