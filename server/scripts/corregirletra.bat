@echo off
echo =========================================
echo   SCRIPT DE NORMALIZACION UNICODE
echo   Corrigiendo caracteres especiales (ñ)
echo =========================================
echo.

cd /d "%~dp0.."
node scripts/corregirletra.js

echo.
echo Presiona cualquier tecla para cerrar...
pause >nul
