import "dotenv/config";
import cors from "cors";
import express from "express";
import path from 'path';
import connectToDatabase from "./config/mongo";
import { router } from "./routes";

const PORT = process.env.PORT || 3001;
const app = express();
app.use(cors());
app.use(express.json());
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
