# Listas de pacientes

El menú Pacientes contiene lista de espera, activos e históricos. `/dashboard/patients` redirige a activos. `GET /patient?careStatus=waiting|active|discharged` combina estado con los filtros existentes de programa. Sin ese parámetro se conserva la consulta general.

- El alta desde Nuevo Paciente (formulario de demanda integrado) guarda `careStatus=waiting`.
- Guardar la ficha de demanda separada establece espera, salvo que exista ingreso o un estado activo/egresado.
- Guardar o actualizar una ficha de ingreso establece activo, salvo egreso confirmado.
- El estado histórico está reservado al futuro formulario de egreso. No hay cambio manual desde la tabla.
- `active` mantiene su función administrativa para integraciones anteriores; no clasifica estas listas. Una alerta de egreso tampoco prueba un egreso.
- La edición general ignora `careStatus`; las transiciones pertenecen al backend. Sincronizar con SISTRAT no cambia la etapa local.

Las consultas clasifican registros antiguos por documentos: ingreso → activo; demanda → espera. También se reconoce la demanda integrada antigua cuando `registeredOnFiclin` está confirmado y existen fecha de solicitud, sustancia principal, tratamientos previos, tipo de contacto, solicitante y derivador. Un estado egresado confirmado prevalece. Un alta nueva en espera permanece visible aunque use demanda integrada. Registros antiguos sin documentos ni estado confirmado requieren revisión y siguen accesibles por ID y por la consulta general, sin aparecer arbitrariamente en alguna etapa.

## Migración opcional

Desde `backend`, con `DB_URI` configurado para la base elegida:

```sh
./node_modules/.bin/ts-node scripts/migrate-care-status.ts
./node_modules/.bin/ts-node scripts/migrate-care-status.ts --apply
```

El primer comando sólo muestra conteos e IDs de casos para revisión; no escribe datos. Revisar ese resultado antes de aplicar y respaldar la base. La aplicación actualiza sólo clasificaciones claras, omite indicadores contradictorios e inactivos manuales, y comprueba el estado anterior para no sobrescribir transiciones concurrentes. Es repetible. No requiere modificar formularios ni datos clínicos. La consulta compatible permite desplegar sin ejecutar la migración.

## Validación

```sh
node --test tests/patient-care-status.test.cjs tests/patient-admission-date.test.cjs
```

Para probar la interfaz: abrir cada submenú, filtrar por programa y nombre, crear demanda, verificar espera, guardar ingreso, verificar activos, volver a guardar demanda y comprobar que sigue activo. Históricos estará vacío mientras no existan egresos confirmados. Revisar también navegación móvil y enlaces antiguos.

## Sincronización histórica desde SISTRAT

En Registro masivo, seleccionar un centro y pulsar **Sincronizar pacientes históricos**. La operación consulta todo el centro; no usa el mes ni la selección de atenciones. El servidor exige administrador para iniciar y consultar el proceso.

Se navega por `#flyout`, el enlace de usuarios históricos y `#filtrar`. Se lee la tercera celda de cada fila (`th` o `td`), se normalizan los códigos y se eliminan duplicados. La tabla completa y DataTables con paginación local están soportados. La paginación remota o desconocida detiene la operación antes de modificar pacientes: hay que adaptar su navegación al HTML real de SISTRAT. La tabla adjunta por sí sola no contiene esos controles. La navegación real queda pendiente de comprobar en el centro seleccionado.

El cruce utiliza centro y código. Códigos inexistentes o ambiguos se informan sin crear pacientes ni elegir coincidencias arbitrarias. Las coincidencias únicas pasan a `discharged`, registrando `historicalSync.source`, `syncedAt` y `jobId`. No se modifica `active` ni se crea ficha o fecha de egreso. El estado histórico tiene prioridad sobre el programa RP y sobre fichas de ingreso anteriores.

La tarea por centro tiene índice único para impedir ejecuciones simultáneas, seguimiento persistido y detección de procesos interrumpidos. Puede repetirse; no reescribe pacientes ya históricos. Los resultados parciales y errores por código permanecen en la tarea. Al volver a seleccionar el centro se recupera su último proceso. Los históricos se excluyen del listado activo de Registro masivo incluso si su caché está desactualizada.

Endpoints (administrador): `POST /patient/sistrat/historical-sync`, `GET /patient/sistrat/historical-sync/:id`, `GET /patient/sistrat/historical-sync/center/:center`.

Pruebas: `node --test tests/historical-sync.test.cjs`. La implementación no ejecuta sincronizaciones automáticamente al desplegar.

## Carga explícita en Registro masivo

Seleccionar un centro limpia el listado anterior y consulta únicamente el último proceso histórico en el backend. No abre SISTRAT ni recupera automáticamente pacientes activos.

- **Recuperar pacientes**: usa caché vigente (TTL configurable con `SISTRAT_CACHE_TTL_HOURS`, seis horas por defecto). Si no existe o venció, espera una consulta a SISTRAT y guarda el nuevo resultado.
- **Actualizar desde SISTRAT**: fuerza una consulta nueva, sin aplicar el antiguo cooldown silencioso. Las consultas simultáneas del mismo centro comparten la ejecución en curso.
- La respuesta incluye `source` y `lastUpdated`, mostrados sobre el listado. Una consulta fallida informa error y permite reintentar; no presenta datos vencidos como actualizados.
- **Registrar atenciones** y **Actualizar alertas** requieren listado cargado y pacientes seleccionados. Durante operaciones se bloquean las acciones incompatibles y el cambio de centro.
- **Sincronizar pacientes históricos** sólo requiere centro seleccionado, sin cargar previamente el listado activo.

Pruebas del flujo: `node --test tests/active-patients-cache.test.cjs tests/attentions-actions.test.cjs`.

## Navegación por tarea

Registro masivo es un submenú exclusivo de administradores:

- `/dashboard/registro-masivo/atenciones`: recuperar pacientes, seleccionar período y registrar atenciones.
- `/dashboard/registro-masivo/alertas`: recuperar pacientes y actualizar sus alertas, sin controles de mes o año.
- `/dashboard/registro-masivo/historicos`: seleccionar centro y sincronizar históricos, sin listado de activos.

La ruta anterior `/dashboard/registro-masivo` redirige a Atenciones. Cada pantalla muestra sólo los controles de su tarea y mantiene la carga explícita. La consulta y reconexión de procesos históricos se realiza en Históricos. Las rutas tienen guard de administrador y el submenú indica la opción activa.


## Prioridad de clasificación

Las tres listas son excluyentes: egreso confirmado → históricos; ficha de ingreso guardada → activos (también en programa RP); sin ingreso ni egreso → espera cuando existe demanda, estado en espera o programa RP. Tener sólo el indicador `registeredAdmissionForm` no sustituye la existencia del documento de ingreso.
