import jsonwebtoken from "jsonwebtoken";
import { Auth } from "../interfaces/auth.interface";
import UserModel from "../models/user.model";
import { encrypt, verified } from "../utils/bcrypt.handle";

const JWT_SECRET = process.env.JWT_SECRET || "token.010101";

const updateUserPassword = async (id: string, password: string) => {
  const user = await UserModel.findOne({ _id:id });

  if (!user) {
    return 'USER_NOT_FOUND';
  }

  const passHash = await encrypt(password);
  user.password = passHash;
  await user.save();

  return 'PASSWORD_UPDATED';
};

const registerNewUser = async (user: any, imageFile: Express.Multer.File | undefined) => {
  
// Normalizar el email a minúsculas
  const email = user.email.toLowerCase().trim();
const userFetched = await UserModel.findOne({ email});
  if (userFetched) return "ALREADY_EXIST";

  console.log('data imageFile en registerNewUser', imageFile);
  const passHash = await encrypt(user.password);
  const newUser = await UserModel.create({
    name: user.name,
    email,
    password: passHash,
    profile: user.profile,
    permissions: user.permissions,
    programs: user.programs,
    signature: imageFile ? `/uploads/${imageFile.filename}` : null,
  });
  return { status: "ok" };
};

const updateUser = async (user: any, imageFile: Express.Multer.File | undefined) => {
  const userFetched = await UserModel.findOne({ email: user.email });
  if (!userFetched) return "USER_NOT_FOUND"; // Si el usuario no existe, retornar un mensaje

  // Si se ha proporcionado una contraseña nueva, encriptarla, de lo contrario, mantener la actual
  const passHash = user.password ? await encrypt(user.password) : userFetched.password;

  try {
    // Actualizar los datos del usuario
    const updatedUser = await UserModel.updateOne(
      { email: user.email }, // Filtro para buscar al usuario
      {
        name: user.name || userFetched.name,
        //password: passHash,
        profile: user.profile || userFetched.profile,
        permissions: user.permissions || userFetched.permissions,
        programs: user.programs || userFetched.programs,
        signature: imageFile ? `/uploads/${imageFile.filename}` : userFetched.signature, // Actualizar la firma si hay una nueva imagen
      }
    );
    return { status: "ok", message: "USER_UPDATED_SUCCESSFULLY" };
  } catch (error) {
    throw new Error(`Error al actualizar paciente: ${error}`);
  }
};

const loginUser = async ({ email, password }: Auth) => {
  try {
	const emailLowercase = email.toLowerCase().trim();
    const userFetched = await UserModel.findOne({ email: emailLowercase }).populate(["permissions", "programs", "profile"]);
    if (!userFetched) return { status: false, msg: "No existe usuario" };

    const passwordHash = userFetched.password;
    const isCorrect = await verified(password, passwordHash);
    if (!isCorrect) return { status: false, msg: "Credenciales incorrectas" };
    const token = jsonwebtoken.sign({ emailLowercase }, JWT_SECRET, { expiresIn: "1h" });

    const { password: onlyPassword, ...userWithoutPass } = userFetched.toObject(); // Convertir a objeto plano

    return { user: userWithoutPass, token, status: true, expiresIn: 3600 };
  } catch (error) {
    console.error("Error in loginUser:", error);
    return { status: false, msg: "Error interno del servidor" };
  }
};

export { registerNewUser, updateUser, loginUser, updateUserPassword };
