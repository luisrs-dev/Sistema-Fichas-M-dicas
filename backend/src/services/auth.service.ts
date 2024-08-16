import jsonwebtoken from "jsonwebtoken";
import { User } from "../interfaces/user.interface";
import UserModel from "../models/user.model";
import { encrypt, verified } from "../utils/bcrypt.handle";
import { Auth } from "../interfaces/auth.interface";
import UserPermissionModel from "../models/parameters/userPermission.model";
import UserProgramModel from "../models/parameters/userProgram.model";

const JWT_SECRET = process.env.JWT_SECRET || "token.010101";

const registerNewUser = async ({user, permissions, programs}: any) => {
  console.log({user, permissions, programs});
  
  const userFetched = await UserModel.findOne({ email: user.email });
  if (userFetched) return "ALREADY_EXIST";

  const passHash = await encrypt(user.password);
  const newUser = await UserModel.create({
    name: user.name,
    email: user.email,
    password: passHash,
    profile: user.profile,
    permissions,
    programs
  });
  return {status:'ok', };
};

const loginUser = async ({ email, password }: Auth) => {
  try {
    const userFetched = await UserModel.findOne({ email }).populate(['permissions','programs','profile']);
    if (!userFetched) return { status: false, msg: "No existe usuario" };
  
    const passwordHash = userFetched.password;
    const isCorrect = await verified(password, passwordHash);
    if (!isCorrect) return { status: false, msg: "Credenciales incorrectas" };
    const token = jsonwebtoken.sign({ email }, JWT_SECRET, { expiresIn: "1h" });

    const { password: onlyPassword, ...userWithoutPass } = userFetched.toObject(); // Convertir a objeto plano

    return { user: userWithoutPass, token, status: true, expiresIn: 3600 };
  } catch (error) {
    console.error("Error in loginUser:", error);
    return { status: false, msg: "Error interno del servidor" };
  }
};

export { registerNewUser, loginUser };
