# Sistema-Fichas-M-dicas


ng build --configuration=development
ng build --configuration=production

ng serve --configuration=production
ng serve --configuration=development

Para crear datos iniciales

tsc backend/src/scripts/init.ts
node backend/src/scripts/init.js

Se debe crear carpeta uploads en backend/src/uploads

Crear archivo ecosystem.config.js
Comando para crear archivo
-> pm2 init simple

Sobreescribir archhivo con este contenido

module.exports = {
    apps: [
      {
        name: "app-ficlin",
        script: "dist/index.js",
        env: {
          NODE_ENV: "development",
          DB_URI: "mongodb://localhost:27017/ceadt",
          PORT: "3002",
          JWT_SECRET: "ll4v3_s3cr3t4_"
        },
        env_production: {
          NODE_ENV: "production",
          DB_URI: "mongodb://127.0.0.1:27017/ceadt",
          PORT: "3002",
          JWT_SECRET: "ll4v3_s3cr3t4_"
        }
      }
    ]
  };

    ## Variables para correo de resumen masivo

    Configurar las siguientes variables de entorno en el backend para habilitar el envío del resumen mensual:

    ```
    SMTP_HOST=
    SMTP_PORT=587
    SMTP_SECURE=false
    SMTP_USER=
    SMTP_PASS=
    SMTP_FROM="Nombre <correo@dominio>"
    BULK_MONTHLY_REPORT_RECIPIENTS=correo1@dominio.com,correo2@dominio.com
    ```

    `BULK_MONTHLY_REPORT_RECIPIENTS` acepta una lista separada por comas de destinatarios que recibirán el correo con el resumen del proceso masivo.

    ### ¿Dónde obtengo estas credenciales?

    - **Correo corporativo (Microsoft 365, Google Workspace, Zoho, etc.)**: el panel de administración permite generar usuarios y contraseñas de aplicación SMTP con TLS. Si tu dominio ya envía correo corporativo, reutiliza ese servicio para aprovechar registros SPF/DKIM existentes.
    - **Proveedores transaccionales (SendGrid, Mailgun, AWS SES, Elastic Email)**: pensados para automatizaciones. Crea una cuenta, valida el dominio y genera una API key/SMTP user que se copia directamente en `SMTP_USER` y `SMTP_PASS`.
    - **Correo personal (Gmail/Outlook)**: solo recomendable para ambientes locales. Activa la verificación en dos pasos y genera una contraseña de aplicación; Gmail usa `smtp.gmail.com` puerto `465` (secure=true) o `587` (secure=false), Outlook `smtp.office365.com` puerto `587`.

    En todos los casos confirma que el servidor acepte conexiones salientes desde la IP del backend (firewall) y que el remitente (`SMTP_FROM`) pertenezca al dominio autorizado por el proveedor.

    ### Probar el envío de correo

    Nuevo endpoint: `POST /medicalRecord/monthRecords/bulk/test-email`

    ```bash
    curl -X POST http://localhost:3002/medicalRecord/monthRecords/bulk/test-email \
      -H "Content-Type: application/json" \
      -d '{"email":"destino@dominio.com","month":12,"year":2025}'
    ```

    - `email` es opcional; si se omite se usan los destinatarios configurados en `BULK_MONTHLY_REPORT_RECIPIENTS`.
    - `month` y `year` son opcionales; por defecto se envía un resumen de prueba usando el mes/año actual.