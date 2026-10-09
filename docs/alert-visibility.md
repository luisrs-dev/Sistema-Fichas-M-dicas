# Alertas visibles por cargo

En Parámetros → Cargos → Alertas, seleccionar las alertas visibles y guardar.
Cada cargo tiene dos botones: Prestaciones y Alertas. Cada diálogo guarda solo
su sección, sin sobrescribir la otra. El formulario de creación incluye ambas.
La selección se aplica a todos los profesionales con ese cargo en las listas
activa, de espera e histórica. Una selección vacía significa que no se muestran
alertas. Los administradores siguen viendo todas.

El filtro “Mostrar solo pacientes con alertas” usa la misma selección que los
iconos. Amarilla y naranja pueden habilitarse independientemente.

Las listas consultan el usuario y su cargo al entrar o recargar, sin requerir un
nuevo inicio de sesión. Una lista ya abierta debe recargarse para recibir cambios.

## Compatibilidad

`profesionalRole.visibleAlerts` es un arreglo opcional con los valores `cie10`,
`consentimiento`, `integracionSocial`, `evaluacion`, `egreso` y `diagnosticoSocial`.
Los cargos existentes sin ese campo conservan las reglas anteriores, incluidas
las excepciones por programa PAI y PR. Al guardar desde el editor, la selección
explícita reemplaza esas reglas. El editor propone los valores anteriores por
cargo y explica que las excepciones por programa dejan de aplicarse.

Las actualizaciones de clientes antiguos que omiten el campo no lo sobrescriben.
La API rechaza valores desconocidos o selecciones que no sean arreglos.

## Alcance

Configura la visualización en las listas, no la autorización de endpoints ni el
acceso directo a formularios. Los bloqueos para registrar atenciones mantienen
sus reglas actuales y sus mensajes explicativos, incluso si el icono está oculto.

## Verificación

- `node --test backend/tests/alert-visibility.test.cjs`
- `node backend/node_modules/typescript/bin/tsc --noEmit -p backend/tsconfig.json`
- En `frontend`: `npm run build -- --configuration development`
