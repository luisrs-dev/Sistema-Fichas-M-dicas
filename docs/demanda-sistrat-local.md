# Validación local del registro de demanda

Rama: `feature/demanda-sistrat-progress`, creada desde el `main` local.

## Implementación

- `POST /patient/demanda/sistrat` devuelve HTTP 202 con `jobId` y `job`. Los dos consumidores del frontend consultan cada 3 segundos el último proceso de tipo `demanda`.
- El panel mantiene disponible la navegación y bloquea solo el formulario del paciente durante el trabajo.
- `COMPLETED` se guarda después de actualizar las alertas y cerrar el navegador. La ventana de éxito requiere el botón **Entendido**; no cierra por Escape, clic exterior o temporizador.
- El último resultado se recupera desde MongoDB, incluso si terminó durante una recarga. La confirmación del usuario se recuerda en este navegador por identificador de tarea.
- `result.submitted` registra el intento de envío antes del clic. `result.registered` se establece cuando el registro se encuentra en SISTRAT. Una validación explícita rechazada permite corregir y reenviar.
- Si se confirmó el registro, se ofrece **Reintentar solo las alertas**. Si el resultado del envío es incierto, se ofrece **Verificar registro en SISTRAT**, que consulta los listados sin enviar otra demanda.
- Los índices únicos de tarea activa e intento protegen contra solicitudes simultáneas. El índice se inicializa antes de iniciar el proceso.
- El backend renueva la vigencia de la tarea cada 15 segundos. Una tarea sin renovación durante 90 segundos se marca interrumpida en la siguiente consulta. No se reenvía automáticamente después de un reinicio.
- `history` conserva fecha de transición y progreso por etapa para medir tiempos. El porcentaje representa etapas, no tiempo restante.
- Se eliminó una navegación duplicada al listado, las pausas fijas de RUT/comunas y las pausas del menú de demandas. El envío espera una transición del formulario o validación visible.
- El modo de revisión manual queda pendiente durante la ventana configurada y termina solicitando verificación, nunca con éxito supuesto.

## Pruebas automatizadas

Desde la raíz:

```sh
node backend/node_modules/typescript/bin/tsc --noEmit -p backend/tsconfig.json
node --test backend/tests/demand-progress.test.cjs
```

Desde `frontend`:

```sh
node node_modules/@angular/cli/bin/ng.js build --configuration development
node node_modules/@angular/cli/bin/ng.js test --watch=false --browsers=ChromeHeadless --include='**/demand-progress.component.spec.ts'
```

Resultado de la validación: 8 pruebas de backend aprobadas y 5 de frontend aprobadas. Karma devolvió código 0, pero Chrome informó una recarga al cerrar el contexto después de finalizar las cinco pruebas; no se ha confirmado la causa de ese mensaje de cierre.

Las pruebas simulan SISTRAT y persistencia; no escriben en la plataforma externa. Las pruebas del panel se ejecutan con Angular/Karma y Chrome Headless.

## Prueba con la aplicación local

1. Tener disponible la base de datos de pruebas configurada en el backend. Durante esta implementación no se encontró MongoDB escuchando en `127.0.0.1:27017`. Se conservaron los cambios previos del usuario en `backend/src/config/mongo.ts`.
2. Ejecutar el backend en el puerto **3002**, que es el destino de `frontend/src/environments/environment.ts`:

   ```sh
   cd backend
   PORT=3002 npm run dev
   ```

3. Ejecutar el frontend:

   ```sh
   cd frontend
   npm start -- --port 4200
   ```

4. Abrir `http://localhost:4200`, iniciar sesión y abrir un paciente de pruebas en **Pacientes → nuevo/editar**. Repetir después desde **Ficha Demanda**.
5. Pulsar **Sincronizar SISTRAT**. Comprobar que aparecen las etapas, que solo se bloquea el formulario y que el menú sigue disponible.
6. Recargar durante la extracción de alertas: debe recuperar el mismo proceso. No debe aparecer éxito hasta terminar el guardado de alertas.
7. Al finalizar, comprobar el código actualizado y la ventana persistente. Escape y clic exterior no deben cerrarla; **Entendido** sí. Recargar después de confirmar no debe mostrarla otra vez.
8. Probar una pérdida temporal de conexión desde las herramientas del navegador: debe avisar y recuperar las consultas sin emitir otro POST.
9. Para errores de alertas o reinicios, utilizar un entorno de pruebas: confirmar el resultado parcial y el botón de reintento/verificación. Nunca debe reenviar una demanda incierta sin verificar.

El modo local del frontend no convierte SISTRAT en un simulador: una ejecución real utiliza el centro y credenciales configurados en la base de datos. No se ejecutaron registros reales durante las pruebas automatizadas.

## Límites de la validación

Se requiere una prueba integrada con la base de datos y SISTRAT para validar los selectores y tiempos reales del sitio. El proceso vive en el servidor Node; no es una cola externa duradera: al reiniciarse se detecta la interrupción y se ofrece verificación, no continuación automática del navegador anterior. Los índices únicos deben poder crearse en la base de datos de pruebas.
