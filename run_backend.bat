@echo off
title MachinaIQ - FastAPI Backend
echo =========================================================================
echo Starting MachinaIQ Industrial Intelligence Backend on http://localhost:8000
echo Swagger UI Documentation: http://localhost:8000/docs
echo =========================================================================
cd /d "%~dp0backend"
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
pause
