param(
  [string]$BackendDbUrl = "postgresql://postgres:postgres@localhost:5432/inka_db_v1"
)

Write-Host "Installing backend dependencies..."
Push-Location "$PSScriptRoot/../backend"
npm install
$env:DATABASE_URL = $BackendDbUrl
npm run db:bootstrap
Pop-Location

Write-Host "Installing frontend dependencies..."
Push-Location "$PSScriptRoot/../frontend"
npm install
Pop-Location

Write-Host "Bootstrap complete."
Write-Host "Run backend: cd backend; npm run dev"
Write-Host "Run frontend: cd frontend; npm run dev"
