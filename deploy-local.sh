#!/usr/bin/env bash
set -euo pipefail

# Ejecutar en el equipo local: ./deploy-local.sh root@IP_DEL_VPS
# Verificar ambos builds sin subir: ./deploy-local.sh --build-only
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REMOTE_ROOT=/home/repositories/ficlin
BUILD_ONLY=false
SSH_TARGET="${1:-}"

if [[ "$SSH_TARGET" == --build-only ]]; then
  BUILD_ONLY=true
elif [[ -z "$SSH_TARGET" || "$SSH_TARGET" == --help ]]; then
  echo "Uso: $0 usuario@host | --build-only"
  echo "Destino: $REMOTE_ROOT (frontend/dist y backend/dist)"
  exit 0
elif [[ ! "$SSH_TARGET" =~ ^[a-zA-Z0-9_][a-zA-Z0-9_.-]*@[a-zA-Z0-9][a-zA-Z0-9.-]*$ ]]; then
  echo "Error: indica el destino como usuario@host o usuario@IPv4." >&2
  exit 1
fi

for command_name in node npm mktemp; do
  command -v "$command_name" >/dev/null || { echo "Falta $command_name" >&2; exit 1; }
done
if [[ "$BUILD_ONLY" == false ]]; then
  for command_name in ssh rsync; do
    command -v "$command_name" >/dev/null || { echo "Falta $command_name" >&2; exit 1; }
  done
fi
if [[ ! -x "$PROJECT_DIR/frontend/node_modules/.bin/ng" || ! -x "$PROJECT_DIR/backend/node_modules/.bin/tsc" ]]; then
  echo "Instala primero las dependencias locales: npm install --prefix frontend && npm install --prefix backend" >&2
  exit 1
fi

BUILD_TMP="$(mktemp -d "${TMPDIR:-/tmp}/ficlin-deploy.XXXXXX")"
trap 'rm -rf -- "$BUILD_TMP"' EXIT

echo "Compilando frontend en el equipo local..."
(
  cd "$PROJECT_DIR/frontend"
  npm run build -- --configuration=production --output-path="$BUILD_TMP/frontend/dashboard-transacciones"
)
echo "Compilando backend en el equipo local..."
(
  cd "$PROJECT_DIR/backend"
  ./node_modules/.bin/tsc --outDir "$BUILD_TMP/backend"
)
test -f "$BUILD_TMP/frontend/dashboard-transacciones/browser/index.html"
test -f "$BUILD_TMP/backend/src/index.js"

if [[ "$BUILD_ONLY" == true ]]; then
  echo "Ambos builds se completaron correctamente. No se subieron archivos."
  exit 0
fi

echo "Verificando destino $SSH_TARGET..."
ssh "$SSH_TARGET" 'bash -se' <<'REMOTE_CHECK'
set -euo pipefail
command -v rsync >/dev/null
command -v pm2 >/dev/null
cd /home/repositories/ficlin/backend
test -f ecosystem.config.js
test -d node_modules
test -d /home/repositories/ficlin/frontend
REMOTE_CHECK

# Sin --delete: conservar uploads, logs, caché y chunks de pestañas abiertas.
# Solo se transfieren los builds limpios; .env y node_modules permanecen en el VPS.
echo "Subiendo backend..."
rsync -az --delay-updates "$BUILD_TMP/backend/" "$SSH_TARGET:$REMOTE_ROOT/backend/dist/"
echo "Subiendo frontend..."
rsync -az --delay-updates "$BUILD_TMP/frontend/" "$SSH_TARGET:$REMOTE_ROOT/frontend/dist/"

echo "Recargando app-ficlin..."
ssh "$SSH_TARGET" 'bash -se' <<'REMOTE_RELOAD'
set -euo pipefail
cd /home/repositories/ficlin/backend
pm2 startOrReload ecosystem.config.js --env production
pm2 show app-ficlin
REMOTE_RELOAD
echo "Builds subidos y recarga de PM2 ejecutada. Comprueba el login en el navegador."
