import mongoose from 'mongoose';

const connectToDatabase = async (retries = 5) => {
  while (retries > 0) {
    try {
      await mongoose.connect("mongodb://ceadt_app:f1cl1n-pl4tf0rm@localhost:27017/ceadt?authSource=admin");
      console.log("Conectado a MongoDB con Mongoose");
      return;
    } catch (error) {
      console.error('Error al conectar a MongoDB. URI:', process.env.DB_URI);
      console.error('Detalle del error:', error instanceof Error ? error.message : error);

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