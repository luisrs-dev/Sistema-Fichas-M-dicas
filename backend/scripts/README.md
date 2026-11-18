# Registro semanal de atenciones en el VPS

El script consulta MongoDB directamente y reutiliza el servicio compilado del backend.
No necesita frontend, token de login ni una petición HTTP de larga duración.
Procesa los centros activos por nombre, uno a la vez, en lotes de **10 pacientes**
activos. Solo envía los que tengan atenciones en el período. Usa el valor exacto de `sistratCenter` del paciente.
Los pacientes sin centro o asociados a centros inactivos no se incluyen.

## Preparación

En el VPS deben existir Node.js, Bash, `flock` (util-linux), las dependencias del
backend, `backend/.env` con `DB_URI`, y un backend compilado actualizado en `dist/src`.
También se necesitan las credenciales de los centros en MongoDB y la configuración
de navegador/proxy que ya usa SISTRAT en producción. El script no modifica esas configuraciones.

Sube esta carpeta `backend/scripts/` al VPS junto con el backend actualizado.
**`deploy-local.sh` solo sube los builds; no copia esta carpeta.** Puedes copiarla
desde tu equipo, en la raíz del repositorio:

```bash
rsync -av backend/scripts/ root@31.97.9.216:/home/repositories/ficlin/backend/scripts/
```

## Primera revisión (sin enviar ni abrir SISTRAT)

En la terminal del VPS:

```bash
cd /home/repositories/ficlin/backend
bash scripts/run-monthly-attentions.sh
```

Solo el día **1** en `America/Santiago` usa el **mes anterior**; desde el
día **2** usa el mes actual. La plataforma cierra el mes anterior el día 1 a las 23:59.
En enero, el mes anterior es diciembre del año anterior.
El período se fija al iniciar y se mantiene para todos los centros. Revisa los conteos por
centro y el archivo JSON indicado en consola. Para elegir un centro o período:

```bash
bash scripts/run-monthly-attentions.sh --center mujeres --month 11 --year 2026
```

Sustituye `mujeres` por el nombre exacto registrado en la aplicación. Puedes repetir
`--center` para seleccionar varios. Mes y año se indican juntos.

### Validar el período sin consultar MongoDB ni SISTRAT

Desde el backend, estos comandos solo imprimen el período elegido:

```bash
node scripts/monthly-attentions.cjs --show-period
node scripts/monthly-attentions.cjs --show-period --date 2026-11-01
node scripts/monthly-attentions.cjs --show-period --date 2026-11-02
node scripts/monthly-attentions.cjs --show-period --date 2027-01-01
```

Los tres ejemplos con fecha deben devolver respectivamente 10/2026, 11/2026 y
12/2026. `--date` es una simulación restringida a `--show-period`; no se puede usar
para ejecutar envíos. El JSON de cada ejecución también guarda `periodSource`.
Para correr las pruebas automáticas sin conexiones externas:

```bash
node --test tests/weekly-attentions.test.cjs
```

## Envío real

Habilita en la configuración de la aplicación `sistrat-direct-record-massive` con
valor **booleano true**; no basta el texto `"true"`. El script verifica esta condición
antes de empezar, sin cambiarla. Primero ejecuta un centro y revisa el resultado en SISTRAT:

```bash
bash scripts/run-monthly-attentions.sh --center mujeres --execute
```

Para todos los centros activos:

```bash
bash scripts/run-monthly-attentions.sh --execute
```

### Control de consumo

Cada lote recupera y agrupa atenciones solo una vez por paciente, de forma secuencial.
Mantiene como máximo las planillas de 10 pacientes en memoria para el envío, y usa
un navegador para ese lote, procesando un paciente a la vez. Al finalizar, el servicio
cierra el navegador; el siguiente lote inicia uno nuevo. En Linux el scraper ya utiliza
modo headless (sin ventana) y, salvo configuración contraria, bloquea imágenes, fuentes
y multimedia. Headless sigue consumiendo CPU y RAM: SISTRAT requiere el navegador
para completar y guardar sus formularios.

Hay una pausa de 5 segundos entre lotes y el resumen se actualiza después de cada lote.
Para reducir más la carga:

```bash
bash scripts/run-monthly-attentions.sh --execute --batch-size 5 --pause-seconds 10
```

`--batch-size` acepta 1 a 100 (por defecto 10); `--pause-seconds`, 0 a 300 (por defecto 5).
Estas opciones también funcionan en revisión. El timer usa los valores por defecto.
Se conservan en memoria los identificadores de los pacientes del centro y el resumen
acumulado, pero las atenciones completas solo se cargan para el lote actual.
Si falla un lote con un error general, se detiene ese centro y se continúa con el
siguiente; los lotes terminados ya están reflejados en el JSON. No se reanudan ni
reintentan automáticamente los envíos. Menos pacientes por lote limita la memoria,
a costa de más inicios de sesión y mayor duración total. Valida el consumo real en el
VPS con un centro antes de activar todos; este límite no garantiza un máximo fijo de RAM.

El servicio existente vuelve a completar la planilla mensual desde FICLIN; no envía
solo las atenciones nuevas. Puede reemplazar valores ingresados directamente en
SISTRAT. No se hacen reintentos automáticos: revisa SISTRAT antes de repetir un envío
fallido, porque podría haberse guardado parcialmente. `success` refleja el resultado
del servicio actual (clic en Guardar y espera), no una lectura posterior que certifique
la persistencia remota. No cambies el modo de guardado durante una ejecución.

Los parámetros `--month MES --year AÑO` tienen prioridad sobre la regla automática.
El timer semanal puede no caer el día 1: esta regla selecciona el período,
pero no garantiza un cierre mensual. Si necesitas ese cierre todos los meses, agrega
una ejecución mensual separada el día 1 a las 00:00 con el mismo script, dejando
margen para terminar antes del cierre de las 23:59. El script fija el período al
inicio; no garantiza completar todos los centros antes del cierre de la plataforma.
Las ejecuciones de este script se bloquean entre sí, incluso para centros distintos.
Además, MongoDB mantiene un bloqueo compartido con el registro por centro del frontend:
solo puede haber un proceso activo de este tipo en el VPS. El bloqueo se conserva
durante todos los lotes del centro y sus pausas. Otro inicio recibe HTTP 409 (web)
o un error registrado en el resumen (terminal); no se encola ni reintenta automáticamente.

## Registro desde el frontend y despliegue

Se puede seleccionar a todos los pacientes. El backend divide la selección en grupos
de 10, espera 5 segundos entre grupos y responde HTTP 202 con el identificador del
proceso sin esperar a SISTRAT. La pantalla consulta el avance cada 3 segundos y muestra
el período, lote, cantidad procesada y resultados guardados. Al volver a la pantalla,
selecciona el centro para recuperar el proceso más reciente. El mes y año elegidos
en pantalla se respetan; la regla del día 1 es exclusiva del script automático.

El registro por centro y sus consultas requieren un administrador autenticado, como
la pantalla existente. Se comprueba la pertenencia de los pacientes al centro y el
guardado automático antes de iniciar. No se abren navegadores en paralelo para estos
procesos. Las alertas y los envíos individuales conservan su funcionamiento anterior.

Los procesos se guardan en `attentionbatchjobs`. El índice único parcial impide dos
procesos activos incluso entre PM2 y el script. El servicio asegura este índice antes
de aceptar el primer proceso, incluso si `autoIndex` está deshabilitado. Las consultas de atenciones tienen un índice compuesto
`patient/date`, recuperan solo `date/service` y reutilizan el formateador de fecha.
Si tu instalación desactiva la creación automática de índices, crea el índice
`patient/date` mediante el procedimiento de administración de MongoDB.

Despliega **backend y frontend juntos**: la respuesta de `/monthRecords/bulk-center`
cambia de resultados finales a `{ job }`. Copia también `backend/scripts/`, que el
deploy de builds no incluye. El script ahora requiere el servicio compilado
`dist/src/services/attentionBatchJob.service.js`; no uses un build anterior.

Los resultados se persisten después de cada lote. Si se reinicia o termina Node,
la siguiente consulta detecta que el PID propietario del mismo VPS ya no existe y
marca el proceso como interrumpido; no lo reenvía. Revisa SISTRAT antes de iniciar otro
registro, porque el último lote puede haberse guardado parcialmente. Un timeout de
consulta no libera el bloqueo de un proceso que sigue vivo. Si cambias de servidor,
contenedor o hostname, revisa manualmente los procesos pendientes antes de liberarlos.
El estado persiste en MongoDB, pero la ejecución usa Node en segundo plano: no es una
cola que reanude automáticamente después de reiniciar. Evita desplegar mientras esté
ejecutándose un registro real.

## Programar cada jueves a las 00:00 (recomendado)

Esto corresponde a la noche del miércoles al jueves en Chile. Los siguientes
comandos se ejecutan en el VPS con permisos de administración, después de validar
un envío manual. Revisa la ruta del proyecto en el `.service` si tu instalación difiere.
El usuario del servicio es root por defecto en esta instalación; si agregas `User=`,
debe tener acceso al `.env`, logs y navegador/proxy de producción.

```bash
command -v node
```

Si Node está instalado mediante NVM u otra ruta fuera de `/usr/local/bin`, `/usr/bin`
y `/bin`, agrega su directorio al `Environment=PATH=...` del archivo `.service`.
systemd no carga el perfil interactivo de tu terminal.

```bash
cd /home/repositories/ficlin/backend
sudo cp scripts/systemd/ficlin-attentions.service /etc/systemd/system/
sudo cp scripts/systemd/ficlin-attentions.timer /etc/systemd/system/
sudo systemd-analyze verify /etc/systemd/system/ficlin-attentions.service /etc/systemd/system/ficlin-attentions.timer
systemd-analyze calendar 'Thu *-*-* 00:00:00 America/Santiago'
sudo systemctl daemon-reload
sudo systemctl enable --now ficlin-attentions.timer
systemctl list-timers ficlin-attentions.timer
```

Activar el timer programa la próxima ejecución; no inicia un envío inmediatamente.
La zona horaria está declarada explícitamente y sigue los cambios de horario de Chile
según la base de zonas del VPS. `Persistent=false` evita iniciar envíos atrasados al
encender el servidor. No agregues además un cron para el mismo proceso.

## Ver resultados y detener la programación

```bash
systemctl status ficlin-attentions.service
journalctl -u ficlin-attentions.service -n 100 --no-pager
ls -lt /home/repositories/ficlin/backend/logs/weekly-attentions-*.json
```

Se guarda un JSON por ejecución, actualizado después de cada centro, con período,
conteos y resultados por identificador de paciente. Los archivos nuevos tienen
permisos privados; administra la retención de los logs según el espacio del VPS.
Un centro fallido no impide procesar el siguiente. Código de salida 0: sin errores
reportados; 1: error de preparación, centro o paciente; 75: otra ejecución tiene el
bloqueo. Si el proceso se interrumpe, el JSON sin `finishedAt` global permite
identificar una ejecución incompleta. Los detalles de scraping quedan en el journal
cuando se usa systemd. No hay correo automático en este nuevo script.

Para desactivar futuras ejecuciones (no interrumpe una ya iniciada):

```bash
sudo systemctl disable --now ficlin-attentions.timer
```
