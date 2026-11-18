#!/usr/bin/env bash
set -euo pipefail
umask 077
BACKEND_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
if [[ " ${*} " == *" --help "* ]]; then
  exec node "$BACKEND_DIR/scripts/monthly-attentions.cjs" --help
fi
command -v flock >/dev/null || { echo 'Se requiere flock (util-linux) en el VPS.' >&2; exit 1; }
command -v node >/dev/null || { echo 'Node.js no está disponible en PATH.' >&2; exit 1; }
mkdir -p "$BACKEND_DIR/logs"
# El kernel libera el bloqueo incluso si el proceso termina abruptamente.
exec 9>"$BACKEND_DIR/logs/weekly-attentions.lock"
flock -n -E 75 9 || { echo 'Ya hay un registro semanal ejecutándose (código 75).' >&2; exit 75; }
export FICLIN_BULK_LOCKED=1
exec node "$BACKEND_DIR/scripts/monthly-attentions.cjs" "$@"
