# Automated Full Rebuild & Desktop Redeploy Script for Reviser
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "   REVISER FULL DESKTOP REDEPLOYMENT     " -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

$rootDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# 0. Verify PostgreSQL is active
Write-Host "`n[0/5] Checking PostgreSQL Database Service..." -ForegroundColor Yellow
$pgService = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue
if ($pgService -and $pgService.Status -ne 'Running') {
    Write-Host "Starting PostgreSQL Service ($($pgService.Name))..." -ForegroundColor Cyan
    Start-Service -Name $pgService.Name
}

# 1. Stop running desktop and java instances first so files are unlocked
Write-Host "`n[1/5] Stopping any running Reviser & background Java processes..." -ForegroundColor Yellow
Get-Process -Name "Reviser","electron","java" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
cmd /c "taskkill /F /IM Reviser.exe /T >nul 2>&1"
cmd /c "taskkill /F /IM electron.exe /T >nul 2>&1"
$maxWait = 10
while ((Get-Process -Name Reviser,electron -ErrorAction SilentlyContinue) -and $maxWait -gt 0) {
    Start-Sleep -Milliseconds 500
    $maxWait--
}
Start-Sleep -Seconds 1

# 2. Build Frontend
Write-Host "`n[2/5] Building Frontend..." -ForegroundColor Yellow
Set-Location "$rootDir\frontend"
npm run build
if ($LASTEXITCODE -ne 0) { Write-Error "Frontend build failed"; exit 1 }

if (!(Test-Path "$rootDir\desktop\dist-frontend")) {
    New-Item -ItemType Directory -Path "$rootDir\desktop\dist-frontend" -Force | Out-Null
}
Copy-Item -Recurse -Force "$rootDir\frontend\dist\*" "$rootDir\desktop\dist-frontend\"

# 3. Package Backend JAR
Write-Host "`n[3/5] Compiling and Packaging Backend JAR..." -ForegroundColor Yellow
Set-Location $rootDir
& "$rootDir\mvnw.cmd" package -DskipTests -DskipFrontend=true
if ($LASTEXITCODE -ne 0) { Write-Error "Backend build failed"; exit 1 }

# 4. Copy JAR to desktop resources
Write-Host "`n[4/5] Copying JAR to Desktop resources..." -ForegroundColor Yellow
Copy-Item -Force "$rootDir\target\Reviser-0.0.1-SNAPSHOT.jar" "$rootDir\desktop\reviser.jar"

# 5. Pack Desktop App
Write-Host "`n[5/5] Packaging Desktop Electron App (dist-app/win-unpacked)..." -ForegroundColor Yellow
Set-Location "$rootDir\desktop"
npm run pack
if ($LASTEXITCODE -ne 0) { Write-Error "Desktop packaging failed"; exit 1 }

# 6. Update Desktop Shortcut
powershell -ExecutionPolicy Bypass -File "$rootDir\desktop\create_shortcut.ps1"

Write-Host "`n=========================================" -ForegroundColor Green
Write-Host "   REVISER DESKTOP SUCCESSFULLY DEPLOYED! " -ForegroundColor Green
Write-Host "   Location: $rootDir\desktop\dist-app\win-unpacked\Reviser.exe" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
