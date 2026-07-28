#!/bin/bash
set -e

echo "🚀 Iniciando despliegue de FicLin..."

# 1. Obtener los últimos cambios de Git
echo "📥 Actualizando código desde Git..."
git pull origin main

# 2. Construir Frontend
echo "📦 Construyendo Frontend..."
cd frontend
npm install
npx ng build --configuration=production
cd ..

# 3. Construir Backend
echo "⚙️ Construyendo Backend..."
cd backend
npm install
npx tsc

# 4. Reiniciar ÚNICAMENTE app-ficlin en PM2 sin afectar otros proyectos
echo "🔄 Recargando app-ficlin en PM2..."
pm2 startOrReload ecosystem.config.js --env production

echo "✅ Despliegue de app-ficlin completado con éxito."