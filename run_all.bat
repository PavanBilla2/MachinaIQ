@echo off
title MachinaIQ - Platform Launcher
echo =========================================================================
echo Launching MachinaIQ Industrial AI Command Center...
echo =========================================================================
start "MachinaIQ Backend" "%~dp0run_backend.bat"
timeout /t 3 /nobreak >nul
start "MachinaIQ Frontend" "%~dp0run_frontend.bat"
echo.
echo Platform launched successfully!
echo Backend API Docs: http://localhost:8000/docs
echo Frontend Console: http://localhost:5173
echo.
pause
