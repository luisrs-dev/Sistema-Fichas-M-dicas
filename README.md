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