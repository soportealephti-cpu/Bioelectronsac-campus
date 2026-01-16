@echo off
echo =========================================
echo   NORMALIZACION UNICODE COMPLETA
echo   Usuarios + Certificados
echo   Corrigiendo caracteres especiales (ñ)
echo =========================================
echo.

cd /d "%~dp0.."
node scripts/corregirletra-completo.js

echo.
echo Presiona cualquier tecla para cerrar...
pause >nul
