import mongoose from 'mongoose';
const uri = process.env.DB_URI as string;

const connectToDatabase = async () => {
  try {
    await mongoose.connect("mongodb://localhost:27017/ceadt");
    console.log("Conectado a MongoDB con Mongoose");
  } catch (error) {
    console.error("Error al conectar a MongoDB", error);
    process.exit(1); // Salir del proceso con error
  }
};

export default connectToDatabase;
