import mongoose from 'mongoose';

const uri = "mongodb://admin:12345@localhost:27017/ceadt";
// const uri = <string>process.env.DB_URI;

const connectToDatabase = async () => {
  try {
    await mongoose.connect(uri);
    console.log("Conectado a MongoDB con Mongoose");
  } catch (error) {
    console.error("Error al conectar a MongoDB", error);
    process.exit(1); // Salir del proceso con error
  }
};

export default connectToDatabase;
