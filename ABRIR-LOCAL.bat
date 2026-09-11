@echo off
cd /d "%~dp0"
echo ==========================================
echo   JRCHOLAN PORTFOLIO PREMIUM - LOCAL
ECHO ==========================================
echo.
where python >nul 2>nul
if errorlevel 1 (
  echo ERROR: Python no esta instalado o no esta en PATH.
  echo Puedes abrir index.html directamente, aunque se recomienda un servidor local.
  pause
  exit /b 1
)
start "" http://localhost:8000/
python -m http.server 8000
