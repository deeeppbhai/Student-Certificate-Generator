@echo off
title SCG Backend API (Port 8000)
color 0A
cd /d "%~dp0"
echo ========================================================
echo  FastAPI Backend Server - Student Certificate Generator
echo  Running at: http://127.0.0.1:8000
echo  Interactive API Docs: http://127.0.0.1:8000/docs
echo ========================================================
echo.
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload --reload-dir app
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Backend failed to start.
    pause
)
