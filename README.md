# FICLIN — inicio local y actualización del VPS

Aplicación de fichas clínicas con frontend Angular, backend Node.js/TypeScript y MongoDB.

## 1. Ubicación de los comandos

Salvo que se indique otra cosa, ejecuta los comandos **en tu equipo, desde la raíz del proyecto**, donde están este README, `package.json`, `frontend/`, `backend/` y `deploy-local.sh`.

```bash
cd /Users/luissebastianreyessilva/Documents/LReyes/ficlin
```

Si estás dentro de `frontend` o `backend`, vuelve con `cd ..`. Los comandos marcados como VPS se ejecutan después de conectarse por SSH.

## 2. Preparación local (primera vez)

Necesitas Node.js y npm compatibles con las versiones del proyecto, Git y un navegador. Para usar la base del VPS necesitas SSH; para desplegar desde Mac/Linux también Bash y rsync. Los comandos Bash pueden ejecutarse desde WSL en Windows.

```bash
node --version
npm --version
npm install
npm install --prefix backend
npm install --prefix frontend
```

Crea `backend/.env` con las credenciales correspondientes. No subas este archivo a Git.

```dotenv
PORT=3002
DB_URI=mongodb://127.0.0.1:27018/ceadt
JWT_SECRET=REEMPLAZAR_POR_UN_SECRETO_PRIVADO
```

Si MongoDB requiere autenticación, utiliza la URI autorizada con usuario, contraseña y `authSource` correspondientes; el ejemplo anterior solo muestra host, puerto y base. Con el túnel de este proyecto, el puerto local es **27018** y el remoto **27017**.

Si prefieres una base MongoDB local independiente, utiliza su URI (habitualmente `mongodb://127.0.0.1:27017/ceadt`) y omite el túnel. **Usar el túnel del VPS implica trabajar sobre su base real: los cambios de datos locales también se guardan allí.**

El backend sirve archivos desde `backend/uploads` cuando se inicia con los scripts documentados. Crea esa carpeta si no existe.

## 3. Levantar en local: Mac / Linux

Abre tres terminales, todas en la raíz del proyecto.

**Terminal 1 — túnel a MongoDB del VPS:**

```bash
npm run tunnel
```

Mantén esta terminal abierta. Para configurar acceso mediante llave, puedes usar `ssh-keygen -t ed25519` y después `ssh-copy-id root@31.97.9.216`. Si ya tienes una llave, reutiliza la existente. La primera conexión SSH permite comprobar la identidad del servidor.

**Terminal 2 — backend:**

```bash
npm run start:backend
```

Debe indicar conexión a MongoDB y servidor en `http://localhost:3002`. Es importante definir `PORT=3002`: sin esa variable, el código utiliza 3001.

**Terminal 3 — frontend con estado del servidor en el login:**

```bash
npm run start:frontend -- --configuration local-start
```

Abre `http://localhost:4200`. Para detener cada proceso, usa `Ctrl+C` en su terminal.

Si ya estás dentro de la carpeta `frontend`, el comando equivalente es:

```bash
npm run start -- --configuration local-start --open --port 4200
```

`npm run dev` inicia backend y frontend normal, pero **no abre el túnel ni activa el indicador del login**. Para revisar el arranque completo, usa las tres terminales anteriores.

## 4. Levantar en local: Windows

Instala las dependencias y configura `backend/.env` como en la sección 2. Desde **CMD**, en la raíz:

```cmd
npm run dev:windows
```

Este comando abre túnel, backend y frontend con `local-start`. Antes ejecuta una conexión `ssh root@31.97.9.216` para comprobar el acceso; configura una llave si deseas evitar introducir la contraseña en cada inicio.

**Atención:** `dev:windows` ejecuta primero `clean:windows`, que intenta terminar todos los procesos `node.exe` y `ssh.exe` del usuario, incluidos los de otros proyectos. Como alternativa, abre tres terminales y ejecuta los comandos de la sección 3 por separado.

## 5. Revisar el estado del servidor en el login

| Configuración frontend | API | Indicador en login |
| --- | --- | --- |
| `local-start` | `http://localhost:3002` | Activado |
| `development` (inicio normal) | `http://localhost:3002` | Desactivado |
| `production` | `/api` | Desactivado |

La opción es `showServerStatus` en `frontend/src/environments/environment.local.ts`, `environment.ts` y `environment.prod.ts`, respectivamente. Reinicia el frontend si cambias de configuración.

Con `local-start`, debajo del logo aparece el estado: conectando, sistema listo (verde) o servidor no disponible (rojo). Consulta cada 3 segundos; después de 30 segundos de fallos muestra que el inicio está tardando. El botón de login queda bloqueado hasta que el sistema esté listo y el formulario sea válido.

Para comprobarlo directamente:

```bash
curl -i http://localhost:3002/health/ready
```

- HTTP 200 con `{"status":"ready"}`: backend conectado y ping de MongoDB correcto.
- HTTP 503 con `{"status":"unavailable"}`: la comprobación de MongoDB falló.
- Conexión rechazada: backend apagado, iniciando o puerto incorrecto. El servidor empieza a escuchar después de conectar a MongoDB.

Este estado no verifica SISTRAT. En las herramientas de desarrollo del navegador, pestaña **Network**, filtra por `health/ready` para revisar las consultas.

## 6. Actualizar el VPS desde tu equipo (flujo principal)

Este flujo utiliza `deploy-local.sh`: compila en tu equipo y sube los archivos compilados al servidor. **No necesita hacer `git pull` en el VPS.** Incluye los cambios locales, aunque todavía no tengan commit; revisa lo que vas a publicar.

### Antes de subir

Desde la raíz local:

```bash
git status --short
bash deploy-local.sh --build-only
```

El segundo comando verifica ambos builds sin conectarse al VPS ni subir archivos. Si falla, corrige el error antes de desplegar.

Guarda en Git los archivos que correspondan a tu cambio para conservar su historial (`git add <archivos>`, `git commit -m "Descripción del cambio"` y `git push origin main`). Hacer push por sí solo no publica la aplicación.

### Subir y recargar

```bash
bash deploy-local.sh root@31.97.9.216
```

El script realiza estas operaciones:

1. Compila frontend en producción y backend en una carpeta temporal local.
2. Comprueba que existan rsync, PM2, dependencias y configuración en el VPS.
3. Sube el backend a `/home/repositories/ficlin/backend/dist/`.
4. Sube el frontend a `/home/repositories/ficlin/frontend/dist/`.
5. Ejecuta, desde el backend remoto, `pm2 startOrReload ecosystem.config.js --env production` y muestra `app-ficlin`.

Conserva `.env`, `node_modules`, uploads, logs y cachés del servidor. No usa `rsync --delete`; también conserva archivos compilados anteriores. No actualiza el checkout Git remoto ni instala dependencias remotas.

**Si cambiaste dependencias del backend:** actualiza también `backend/package.json` y sus dependencias en el servidor antes de recargar. El despliegue de builds por sí solo no lo hace. Los cambios de variables de entorno, Nginx o configuración PM2 también se aplican por separado en el VPS.

### Verificar después de subir

Desde tu equipo:

```bash
ssh root@31.97.9.216
```

Ya en el VPS:

```bash
cd /home/repositories/ficlin/backend
pm2 status
pm2 show app-ficlin
pm2 logs app-ficlin --lines 50
```

Sal de la vista de logs con `Ctrl+C`; esto no detiene la aplicación. Comprueba la API (si el puerto configurado es 3002):

```bash
curl -i http://127.0.0.1:3002/health/ready
```

Después abre la URL habitual de producción, recarga el navegador y prueba el login y la funcionalidad modificada. El indicador visual no aparece en producción porque está desactivado allí.

## 7. Alternativa: actualizar desde Git dentro del VPS

Usa esta vía cuando los cambios estén publicados en `origin/main` y quieras compilar en el servidor. Es una alternativa al despliegue local; no hace falta ejecutar ambas vías en cada actualización.

Desde tu equipo:

```bash
ssh root@31.97.9.216
```

En el VPS:

```bash
cd /home/repositories/ficlin
git status --short
bash deploy.sh
```

Revisa primero los cambios locales del servidor y resuélvelos antes de actualizar. `deploy.sh` ejecuta `git pull origin main`, instala dependencias y compila frontend/backend; después recarga PM2 usando `backend/ecosystem.config.js`.

Verifica el resultado con los comandos de la sección 6. Esta vía requiere recursos suficientes en el VPS para compilar Angular y TypeScript.

## 8. Configuración del VPS y PM2

Los scripts presuponen un servidor ya preparado con Node.js/npm, MongoDB accesible, PM2, rsync y el proyecto en `/home/repositories/ficlin`. El acceso público debe servir el frontend compilado y enviar `/api` al backend quitando ese prefijo, ya que Express expone rutas como `/health/ready` directamente.

El frontend compilado se encuentra en:

```text
/home/repositories/ficlin/frontend/dist/dashboard-transacciones/browser
```

`backend/ecosystem.config.js` está excluido de Git y debe existir en el servidor. Para inspeccionar la configuración real:

```bash
cd /home/repositories/ficlin/backend
cat ecosystem.config.js
pm2 show app-ficlin
ls dist/src/index.js
```

La compilación que valida `deploy-local.sh` genera `dist/src/index.js`; comprueba que PM2 utilice ese archivo. El README anterior indicaba `dist/index.js`, por lo que no conviene copiar ese ejemplo sin revisar la salida real.

Ejemplo de configuración para un servidor nuevo (conservar la configuración existente al actualizar):

```javascript
module.exports = {
  apps: [{
    name: 'app-ficlin',
    cwd: '/home/repositories/ficlin/backend',
    script: 'dist/src/index.js',
    env_production: {
      NODE_ENV: 'production',
      PORT: '3002'
    }
  }]
};
```

Define `DB_URI` y `JWT_SECRET` privados en `backend/.env` o en la configuración de entorno existente. En el VPS, MongoDB normalmente se accede por `127.0.0.1:27017`, sin el túnel local de desarrollo. No reemplaces credenciales existentes por valores de ejemplo.

Para guardar la lista actual de procesos tras la configuración inicial:

```bash
pm2 save
```

La configuración real de Nginx, dominio, certificados y arranque automático de PM2 no está incluida en este repositorio; revísala en el VPS antes de modificarla.

## 9. Correo del resumen mensual (opcional)

Configura en el entorno del backend:

```dotenv
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
SMTP_FROM="Nombre <correo@dominio>"
BULK_MONTHLY_REPORT_RECIPIENTS=correo1@dominio.com,correo2@dominio.com
```

Utiliza las credenciales SMTP de tu proveedor; los destinatarios aceptan una lista separada por comas. No guardes contraseñas en este README ni en Git.

La ruta de prueba de correo está definida actualmente con un espacio inicial (`/ monthRecords/bulk/test-email`) en `backend/src/routes/medicalRecord.ts`. El endpoint sin ese espacio descrito en el README anterior no coincide con el código; revisa esa ruta antes de usarlo como prueba de despliegue.

## 10. Problemas frecuentes

| Problema | Qué revisar |
| --- | --- |
| `Missing script: start:frontend` | Estás dentro de `frontend`; usa su comando de la sección 3 o vuelve a la raíz. |
| No aparece el estado en login | Inicia con `--configuration local-start` y abre el frontend local correcto. |
| Backend no conecta a MongoDB | Túnel abierto, puerto 27018 en la URI local, credenciales y conectividad SSH. |
| Login indica servidor no disponible | Comprueba `/health/ready`, backend en puerto 3002 y errores de Network. |
| Puerto ocupado | Detén el proceso anterior. En Mac/Linux: `lsof -nP -iTCP:3002 -sTCP:LISTEN` (cambia el puerto para 4200/27018). |
| Despliegue falla antes de subir | Revisa el error de build y las dependencias locales. |
| PM2 falla al recargar | Revisa `ecosystem.config.js`, ruta del archivo compilado y `pm2 logs app-ficlin`. |
| La web sigue mostrando la versión anterior | Recarga sin caché y verifica que el servidor web sirva la carpeta compilada indicada. |

Para un reinicio manual del backend ya configurado, en el VPS:

```bash
cd /home/repositories/ficlin/backend
pm2 startOrReload ecosystem.config.js --env production
```

Este comando solo recarga la aplicación; no sube ni compila cambios.
