@echo off
title Stop Student Certificate Generator
echo =====================================================================
echo          STOPPING STUDENT CERTIFICATE GENERATOR SERVERS              
echo =====================================================================
echo.
echo [*] Terminating processes on port 8000 (FastAPI Backend)...
powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue | ForEach-Object { $proc = Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue; if ($proc) { Write-Host ('Terminated PID ' + $proc.Id + ' (' + $proc.ProcessName + ')'); Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue } }"

echo [*] Terminating processes on port 5173 (Vite React Frontend)...
powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue | ForEach-Object { $proc = Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue; if ($proc) { Write-Host ('Terminated PID ' + $proc.Id + ' (' + $proc.ProcessName + ')'); Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue } }"

echo.
echo [OK] All servers have been stopped and ports are freed.
timeout /t 2 /nobreak >nul
