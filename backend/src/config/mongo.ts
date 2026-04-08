import mongoose from 'mongoose';

const connectToDatabase = async (retries = 5) => {
  const primaryUri = process.env.DB_URI || "mongodb://localhost:27017/ceadt";
  const fallbackUri = "mongodb://ceadt_app:f1cl1n-pl4tf0rm@localhost:27017/ceadt?authSource=admin";

  while (retries > 0) {
    try {
      console.log(`Intentando conectar a MongoDB...`);
      // Intentamos con la URI principal
      await mongoose.connect(primaryUri);
      console.log("Conectado a MongoDB (URI Principal)");
      return;
    } catch (error) {
      console.warn("Fallo conexión con URI Principal. Intentando con URI de Respaldo/VPS...");
      
      try {
        // Si falla la principal, intentamos con la de respaldo (VPS con auth)
        await mongoose.connect(fallbackUri);
        console.log("Conectado a MongoDB (URI de Respaldo/VPS)");
        return;
      } catch (fallbackError) {
        console.error("Error crítico: Fallaron ambas conexiones a MongoDB.");
      }

      retries--;
      if (retries === 0) process.exit(1);
      console.log(`Reintentando en 5 segundos... (${retries} intentos restantes)`);
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
};

export default connectToDatabase;
