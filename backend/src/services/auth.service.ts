import jsonwebtoken from "jsonwebtoken";
import { User } from "../interfaces/user.interface";
import UserModel from "../models/user.model";
import { encrypt, verified } from "../utils/bcrypt.handle";
import { Auth } from "../interfaces/auth.interface";

const JWT_SECRET = process.env.JWT_SECRET || "token.010101";

const registerNewUser = async ({ email, password, name }: User) => {
  const user = await UserModel.findOne({ email });
  console.log({ user });

  if (user) return "ALREADY_EXIST";

  const passHash = await encrypt(password);

  const registerNewUser = await UserModel.create({
    email,
    password: passHash,
    name,
  });
  return registerNewUser;
};

const loginUser = async ({ email, password }: Auth) => {
  try {
    const userFetched = await UserModel.findOne({ email });
    if (!userFetched) return { status: false, msg: "No existe usuario" };
  
    const passwordHash = userFetched.password;
    const isCorrect = await verified(password, passwordHash);
    if (!isCorrect) return { status: false, msg: "Credenciales incorrectas" };
    const token = jsonwebtoken.sign({ email }, JWT_SECRET, { expiresIn: "1h" });
    return { email, token, status: true, expiresIn: 3600 };

  } catch (error) {
    console.error("Error in loginUser:", error);
    return { status: false, msg: "Error interno del servidor" };
  }
};

export { registerNewUser, loginUser };
