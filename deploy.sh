pm2 delete all
git pull origin main 

cd frontend
ng build --configuration=production


cd ..
cd backend
tsc
# pm2 start dist/index.js
pm2 start ecosystem.config.js --env production