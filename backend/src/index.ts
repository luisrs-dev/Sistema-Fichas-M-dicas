import "dotenv/config";
import express from "express";
import cors from "cors";
import { router } from "./routes";
import connectToDatabase from "./config/mongo";

const PORT = process.env.PORT || 3001;
const app = express();
app.use(cors());
app.use(express.json());
app.use(router);

connectToDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
  });
}).catch(error => {
  console.error("Error al conectar a la base de datos", error);
});
