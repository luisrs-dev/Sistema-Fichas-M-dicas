import mongoose from 'mongoose';
const uri = process.env.DB_URI as string;

const connectToDatabase = async () => {
  try {
    await mongoose.connect("mongodb://localhost:27017/ceadt");
    // await mongoose.connect("mongodb://lreyes:f1ch4sM3d1c4s@31.97.9.216:27017/ceadt?authSource=admin");
    // MongoAtalss
    // await mongoose.connect("mongodb+srv://ficlin:8AQbXU9avpFqOLAE@ficlin.je3mmso.mongodb.net/ficlin_dba?retryWrites=true&w=majority&appName=Ficlin");    
    console.log("Conectado a MongoDB con Mongoose");
  } catch (error) {
    console.error("Error al conectar a MongoDB", error);
    process.exit(1); // Salir del proceso con error
  }
};

export default connectToDatabase;
