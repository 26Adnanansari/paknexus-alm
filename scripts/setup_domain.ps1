param(
    [Parameter(Mandatory = $true)]
    [string]$Domain
)

Write-Host "Setting up domain: $Domain" -ForegroundColor Green

# 1. Update Root .env
$EnvPath = "d:\almsaas\.env"
if (Test-Path $EnvPath) {
    $Content = Get-Content $EnvPath
    $Content = $Content -replace "APP_DOMAIN=.*", "APP_DOMAIN=$Domain"
    $Content = $Content -replace "CORS_ORIGINS=.*", "CORS_ORIGINS=https://admin.$Domain,https://app.$Domain,http://localhost:3000,http://localhost:3001"
    $Content | Set-Content $EnvPath
    Write-Host "Updated root .env" -ForegroundColor Cyan
}

# 2. Update Admin Dashboard .env.local
$AdminEnvPath = "d:\almsaas\admin-dashboard\.env.local"
if (Test-Path $AdminEnvPath) {
    $Content = Get-Content $AdminEnvPath
    $Content = $Content -replace "NEXT_PUBLIC_APP_DOMAIN=.*", "NEXT_PUBLIC_APP_DOMAIN=$Domain"
    $Content | Set-Content $AdminEnvPath
    Write-Host "Updated admin-dashboard .env.local" -ForegroundColor Cyan
}

# 3. Update Tenant App .env.local
$TenantEnvPath = "d:\almsaas\tenant-app\.env.local"
if (Test-Path $TenantEnvPath) {
    $Content = Get-Content $TenantEnvPath
    $Content = $Content -replace "NEXT_PUBLIC_APP_DOMAIN=.*", "NEXT_PUBLIC_APP_DOMAIN=$Domain"
    $Content | Set-Content $TenantEnvPath
    Write-Host "Updated tenant-app .env.local" -ForegroundColor Cyan
}

Write-Host "`nDomain setup complete! Log in again to apply changes." -ForegroundColor Green
Write-Host "Note: Remember to update your CORS_ORIGINS in .env if you use different subdomains for production." -ForegroundColor Yellow
