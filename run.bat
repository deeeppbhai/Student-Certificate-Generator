@echo off
setlocal enabledelayedexpansion
title Student Certificate Generator - Launcher

set "ROOT_DIR=%~dp0"
cd /d "%ROOT_DIR%"

if "%~1"=="menu" goto :show_menu
if "%~1"=="pipeline" goto :run_pipeline
if "%~1"=="robot" goto :run_robot
if "%~1"=="live" goto :run_live
if "%~1"=="stop" goto :stop_services

:: Default action: Start the Full-Stack Application immediately!
:start_full_app
cls
echo =====================================================================
echo          STUDENT CERTIFICATE GENERATOR - FULL STACK APP              
echo =====================================================================
echo.
echo [*] Checking system prerequisites...

where python >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python not found in system PATH. Please ensure Python 3.10+ is installed.
    pause
    exit /b 1
)

where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] npm / Node.js not found in system PATH. Please ensure Node.js is installed.
    pause
    exit /b 1
)

echo [OK] Python and Node.js detected.
echo.

echo [*] Launching FastAPI Backend on http://127.0.0.1:8000 ...
start "SCG - Backend API (FastAPI :8000)" "%ROOT_DIR%backend\start_backend.bat"

echo [*] Launching Vite React Frontend on http://localhost:5173 ...
start "SCG - Frontend UI (Vite React :5173)" "%ROOT_DIR%frontend\start_frontend.bat"

echo.
echo [*] Waiting 4 seconds for servers to initialize...
powershell -Command "Start-Sleep -Seconds 4"

echo [*] Opening Web Browser to http://localhost:5173 ...
start http://localhost:5173

echo.
echo =====================================================================
echo               APPLICATION RUNNING SUCCESSFULLY!                      
echo =====================================================================
echo  - Frontend Web UI:    http://localhost:5173
echo  - Backend API Docs:   http://127.0.0.1:8000/docs
echo  - Default Admin:      admin@scg.edu / admin123
echo    (Auto-Login is enabled on the login screen by default)
echo.
echo  Keep the backend and frontend command windows open while working.
echo  To shut down both servers cleanly, run 'stop.bat'.
echo =====================================================================
echo.
echo Other launcher commands:
echo   run.bat menu      - Interactive options menu
echo   run.bat pipeline  - Run batch Excel to PDF certificate generator
echo   run.bat robot     - Run Robot Framework RPA tests (Direct/Headless)
echo   run.bat live      - Run Live Visible Desktop Browser RPA Automation (Chrome)
echo   stop.bat          - Stop backend and frontend servers
echo =====================================================================
echo.
pause
exit /b 0

:show_menu
cls
echo =====================================================================
echo          STUDENT CERTIFICATE GENERATOR - SYSTEM LAUNCHER             
echo =====================================================================
echo.
echo  [1] Start Full Application (FastAPI Backend + Vite Frontend)
echo  [2] Run Batch Certificate Generator Pipeline (Python)
echo  [3] Run Robot Framework Automated RPA Test Suite (Direct/Headless)
echo  [4] Run Live Visible Desktop Browser RPA Automation (Chrome)
echo  [5] Stop Running Backend & Frontend Servers (Free Ports 8000 & 5173)
echo  [6] Exit
echo.
echo =====================================================================
set /p USER_CHOICE="Enter option [1-6]: "

if "%USER_CHOICE%"=="1" goto :start_full_app
if "%USER_CHOICE%"=="2" goto :run_pipeline
if "%USER_CHOICE%"=="3" goto :run_robot
if "%USER_CHOICE%"=="4" goto :run_live
if "%USER_CHOICE%"=="5" goto :stop_services
if "%USER_CHOICE%"=="6" exit /b 0
goto :show_menu

:run_pipeline
cls
echo =====================================================================
echo        RUNNING BATCH CERTIFICATE GENERATION & DOWNLOAD PIPELINE      
echo =====================================================================
echo.
python "%ROOT_DIR%auto_generate_and_download.py"
echo.
echo =====================================================================
echo Pipeline finished! Certificates and ZIP generated in output/ directory.
echo =====================================================================
echo.
pause
exit /b 0

:run_robot
cls
echo =====================================================================
echo         RUNNING ROBOT FRAMEWORK END-TO-END 12-STAGE RPA SUITE         
echo =====================================================================
echo.
python "%ROOT_DIR%run_rpa.py"
echo.
echo [OK] RPA Automation execution complete.
if exist "%ROOT_DIR%robot\results\report.html" (
    echo [*] Opening HTML test report in browser...
    start "" "%ROOT_DIR%robot\results\report.html"
)
echo.
pause
exit /b 0

:run_live
cls
echo =====================================================================
echo    RUNNING LIVE VISIBLE DESKTOP BROWSER RPA SUITE (CHROME)           
echo =====================================================================
echo.
python "%ROOT_DIR%run_live_browser.py"
echo.
echo [OK] Live Browser RPA execution complete.
if exist "%ROOT_DIR%robot\results\live\live_report.html" (
    echo [*] Opening Live HTML test report in browser...
    start "" "%ROOT_DIR%robot\results\live\live_report.html"
)
echo.
pause
exit /b 0

:stop_services
cls
echo =====================================================================
echo               STOPPING BACKGROUND SERVICES                           
echo =====================================================================
echo [*] Stopping processes on ports 8000 (Backend) and 5173 (Frontend)...
powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 8000, 5173 -ErrorAction SilentlyContinue | ForEach-Object { $proc = Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue; if ($proc) { Write-Host ('Terminated PID ' + $proc.Id + ' (' + $proc.ProcessName + ')'); Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue } }"
echo [OK] Ports freed successfully.
powershell -Command "Start-Sleep -Seconds 2"
exit /b 0
