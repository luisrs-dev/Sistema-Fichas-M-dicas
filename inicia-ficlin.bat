@echo off
title Sistema Fichas Medicas - Iniciador
setlocal

echo [INFO] Cerrando instancias previas de fichas medicas...
taskkill /F /IM node.exe /T >nul 2>&1
taskkill /F /IM ssh.exe /T >nul 2>&1
echo.

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

echo [INFO] Iniciando Túnel SSH...
echo [INFO] Esperando 5 segundos para estabilizar la conexión a la base de datos...
echo.

:: Ejecuta el comando dev:windows del package.json que ya incluye el timeout
call npm run dev:windows

echo.
echo [OK] Proceso de inicio completado. 
echo [!] No cierres las ventanas que se abrieron.
pause