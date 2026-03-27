import mongoose from "mongoose";
import SistratCenterModel from "./src/models/sistratCenter.model";
import dotenv from "dotenv";

dotenv.config();

const centers = [
  { name: "mujeres", usuario: "rmorales", password: "Robe1010", active: true },
  { name: "hombres", usuario: "rmorales", password: "Robe0011", active: true },
  { name: "alameda", usuario: "rmoralesn", password: "Robe1234", active: true },
];

const seedCenters = async () => {
  try {
    await mongoose.connect(process.env.DB_URI || "mongodb://localhost:27017/sistema-fichas");
    console.log("Conectado a la base de datos");

    for (const center of centers) {
      await SistratCenterModel.findOneAndUpdate(
        { name: center.name },
        center,
        { upsert: true, new: true }
      );
      console.log(`Centro ${center.name} insertado/actualizado`);
    }

    console.log("Seed completado");
    process.exit(0);
  } catch (error) {
    console.error("Error en seed:", error);
    process.exit(1);
  }
};

seedCenters();
