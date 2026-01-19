$host.ui.RawUI.WindowTitle = "PakAi Nexus - Dev Launcher"
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "   PakAi Nexus Multi-Tenant SaaS Dev      " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# Function to stop process on port
function Stop-ProcessOnPort {
    param([int]$Port)
    $ProcessId = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -First 1
    if ($ProcessId) {
        Write-Host "Stopping existing process on port $Port (PID: $ProcessId)..." -ForegroundColor Yellow
        Stop-Process -Id $ProcessId -Force
    }
}

Write-Host "Cleaning up existing processes..." -ForegroundColor Gray
Stop-ProcessOnPort 8000 # Backend
Stop-ProcessOnPort 3000 # Admin
Stop-ProcessOnPort 3001 # Tenant

# Start Backend
Write-Host "Starting Backend (FastAPI) on :8000..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd d:\almsaas; uvicorn app.main:app --reload --port 8000"

# Start Admin Dashboard
Write-Host "Starting Admin Dashboard on :3000..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd d:\almsaas\admin-dashboard; `$env:PORT=3000; npm run dev"

# Start Tenant App
Write-Host "Starting Tenant App on :3001..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd d:\almsaas\tenant-app; `$env:PORT=3001; npm run dev"

Write-Host "`nAll services starting!" -ForegroundColor Cyan
Write-Host "------------------------------------------"
Write-Host "Backend API:      http://localhost:8000"
Write-Host "Admin Dashboard: http://localhost:3000"
Write-Host "Tenant App:      http://localhost:3001"
Write-Host "------------------------------------------"
Write-Host "Press any key to close this status window (services will keep running)..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
