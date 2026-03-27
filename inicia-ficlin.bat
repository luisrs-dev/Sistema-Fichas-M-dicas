@echo off
title Sistema Fichas Medicas - Iniciador
setlocal

echo ====================================================
echo   1. ACTUALIZANDO CODIGO (GIT PULL)
echo ====================================================
git pull

echo.
echo ====================================================
echo   2. INICIANDO ENTORNO (TUNNEL, BACK Y FRONT)
echo ====================================================
echo [INFO] Se abriran 3 ventanas de comandos.
echo [INFO] Angular abrira el navegador en localhost:4200 al terminar.
echo.

:: Ejecuta el comando dev:windows del package.json
call npm run dev:windows

echo.
echo [OK] Proceso de inicio completado. 
echo [!] No cierres las ventanas que se abrieron.
pause