# Student Certificate Generator - PowerShell Launcher
$ErrorActionPreference = "Stop"
$rootDir = $PSScriptRoot

Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host "         STUDENT CERTIFICATE GENERATOR - SYSTEM LAUNCHER             " -ForegroundColor Cyan
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host " [1] Start Full Application (FastAPI Backend + Vite Frontend) [DEFAULT]" -ForegroundColor Yellow
Write-Host " [2] Run Batch Certificate Generator Pipeline (Python)" -ForegroundColor White
Write-Host " [3] Run Robot Framework Automated RPA Test Suite" -ForegroundColor White
Write-Host " [4] Stop Running Backend & Frontend Servers (Ports 8000 & 5173)" -ForegroundColor White
Write-Host " [5] Exit" -ForegroundColor White
Write-Host ""
Write-Host "=====================================================================" -ForegroundColor Cyan

$choice = Read-Host "Select an option [1-5] (Press Enter for [1])"
if ([string]::IsNullOrWhiteSpace($choice)) { $choice = "1" }

switch ($choice) {
    "1" {
        Write-Host "`n[*] Starting FastAPI Backend..." -ForegroundColor Green
        Start-Process cmd -ArgumentList "/k cd /d `"$rootDir\backend`" && title SCG Backend API (Port 8000) && color 0A && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload --reload-dir app"
        
        Write-Host "[*] Starting Vite React Frontend..." -ForegroundColor Green
        Start-Process cmd -ArgumentList "/k cd /d `"$rootDir\frontend`" && title SCG Frontend UI (Port 5173) && color 0B && npm run dev"
        
        Write-Host "[*] Waiting 4 seconds for servers to start..." -ForegroundColor Gray
        Start-Sleep -Seconds 4
        
        Write-Host "[*] Opening browser to http://localhost:5173 ..." -ForegroundColor Cyan
        Start-Process "http://localhost:5173"
        
        Write-Host "`n[OK] Application is running!" -ForegroundColor Green
        Write-Host "  - Frontend: http://localhost:5173" -ForegroundColor White
        Write-Host "  - API Docs: http://127.0.0.1:8000/docs" -ForegroundColor White
        Write-Host "  - Admin:    admin@scg.edu / admin123" -ForegroundColor White
        Write-Host "To stop servers, run: .\stop.bat" -ForegroundColor Yellow
    }
    "2" {
        Write-Host "`n[*] Running auto_generate_and_download.py..." -ForegroundColor Cyan
        & python "$rootDir\auto_generate_and_download.py"
    }
    "3" {
        Write-Host "`n[*] Running Complete Robot Framework 12-Stage RPA Suite..." -ForegroundColor Cyan
        & python "$rootDir\run_rpa.py"
        if (Test-Path "$rootDir\robot\results\report.html") {
            Start-Process "$rootDir\robot\results\report.html"
        }
    }
    "4" {
        Write-Host "`n[*] Stopping processes on ports 8000 & 5173..." -ForegroundColor Yellow
        Get-NetTCPConnection -LocalPort 8000, 5173 -ErrorAction SilentlyContinue | ForEach-Object {
            $p = Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue
            if ($p) {
                Write-Host "Stopping $($p.ProcessName) (PID $($p.Id))..."
                Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue
            }
        }
        Write-Host "[OK] Stopped." -ForegroundColor Green
    }
    "5" {
        Write-Host "Exiting."
    }
    default {
        Write-Host "Invalid choice." -ForegroundColor Red
    }
}
