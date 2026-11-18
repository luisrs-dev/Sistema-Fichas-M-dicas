import "dotenv/config";
import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import path from 'path';
import connectToDatabase from "./config/mongo";
import { router } from "./routes";

const PORT = process.env.PORT || 3001;
const app = express();
app.use(cors());
app.use(express.json());
app.get('/health/ready', async (_req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  try {
    if (mongoose.connection.readyState !== 1 || !mongoose.connection.db) {
      res.status(503).json({ status: 'unavailable' });
      return;
    }
    await mongoose.connection.db.admin().ping({ maxTimeMS: 1500 });
    res.status(200).json({ status: 'ready' });
  } catch {
    res.status(503).json({ status: 'unavailable' });
  }
});
app.use(router);

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

connectToDatabase().then(() => {
  const server = app.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
  });
  // Configurar timeout largo (10 minutos) para procesos de scraping de SISTRAT
  server.timeout = 600000;
  server.keepAliveTimeout = 600000;
  server.headersTimeout = 601000;
}).catch(error => {
  console.error("Error al conectar a la base de datos", error);
});
