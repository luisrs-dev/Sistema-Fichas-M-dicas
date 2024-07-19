import "dotenv/config";
import express from "express";
import cors from "cors";
import { router } from "./routes";
import dbConnect from "./config/mongo";

const PORT = process.env.PORT || 3001;
const app = express();
app.use(cors());
app.use(express.json());
app.use(router);

dbConnect()
  .then(() => console.log("Conected to database"))
  .catch(() => console.log("Failed connect to database"));

app.listen(PORT, () =>
  console.log(`Initialized server on port ${PORT} http://localhost:${PORT}`)
);
