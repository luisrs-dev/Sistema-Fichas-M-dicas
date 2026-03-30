import mongoose from 'mongoose';

const connectToDatabase = async (retries = 5) => {
  while (retries > 0) {
    try {
      await mongoose.connect(process.env.DB_URI as string);
      console.log("Conectado a MongoDB con Mongoose");
      return;
    } catch (error) {
      retries--;
      console.error(`Error al conectar a MongoDB. Intentos restantes: ${retries}`);
      if (retries === 0) {
        process.exit(1);
      }
      console.log("Reintentando en 5 segundos...");
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
};

export default connectToDatabase;
