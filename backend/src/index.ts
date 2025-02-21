import dotenv from "dotenv";
import cors from "cors";
import "dotenv/config";
import express from "express";
import path from 'path';
import connectToDatabase from "./config/mongo";
import { router } from "./routes";

// Cargar variables de entorno según el entorno actual
if (process.env.NODE_ENV !== "production") {
  dotenv.config();
}

const PORT = process.env.PORT || 3001;
const app = express();
app.use(cors());
app.use(express.json());
app.use(router);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

connectToDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
  });
}).catch(error => {
  console.error("Error al conectar a la base de datos", error);
});
