@echo off
title SCG Frontend UI (Port 5173)
color 0B
cd /d "%~dp0"
echo ========================================================
echo  React Vite Frontend - Student Certificate Generator
echo  Running at: http://localhost:5173
echo ========================================================
echo.
npm run dev
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Frontend failed to start.
    pause
)
