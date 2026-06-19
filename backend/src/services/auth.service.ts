import jsonwebtoken from "jsonwebtoken";
import { Auth } from "../interfaces/auth.interface";
import UserModel from "../models/user.model";
import { encrypt, verified } from "../utils/bcrypt.handle";
import fs from "fs";

const JWT_SECRET = process.env.JWT_SECRET || "token.010101";

const updateUserPassword = async (id: string, password: string) => {
  const user = await UserModel.findOne({ _id: id });

  if (!user) {
    return 'USER_NOT_FOUND';
  }

  const passHash = await encrypt(password);
  user.password = passHash;
  await user.save();

  return 'PASSWORD_UPDATED';
};

const syncSignatureToVPS = async (imageFile: Express.Multer.File) => {
  try {
    const filePath = imageFile.path;
    if (!fs.existsSync(filePath)) {
      console.error(`[syncSignatureToVPS] El archivo local no existe en la ruta: ${filePath}`);
      return;
    }
    const fileBuffer = fs.readFileSync(filePath);
    
    const FormDataClass = (globalThis as any).FormData;
    const BlobClass = (globalThis as any).Blob;
    const fetchFunc = (globalThis as any).fetch;

    if (!FormDataClass || !BlobClass || !fetchFunc) {
      console.error(`[syncSignatureToVPS] Fetch, FormData o Blob no están soportados en este entorno de Node.js.`);
      return;
    }

    const formData = new FormDataClass();
    const blob = new BlobClass([fileBuffer], { type: imageFile.mimetype });
    formData.append('image', blob, imageFile.originalname);

    console.log(`[syncSignatureToVPS] Enviando firma al VPS (${imageFile.filename})...`);
    const response = await fetchFunc('http://ficlin.cl/api/auth/sync-signature', {
      method: 'POST',
      body: formData,
      headers: {
        'x-original-filename': imageFile.filename
      }
    });

    if (response.ok) {
      console.log(`[syncSignatureToVPS] Firma sincronizada exitosamente con el VPS: ${imageFile.filename}`);
    } else {
      console.error(`[syncSignatureToVPS] Error al sincronizar con el VPS. Estatus: ${response.status}`);
    }
  } catch (error: any) {
    console.error(`[syncSignatureToVPS] Error de red al sincronizar firma con el VPS:`, error.message);
  }
};

const registerNewUser = async (user: any, imageFile: Express.Multer.File | undefined) => {

  // Normalizar el email a minúsculas
  const email = user.email.toLowerCase().trim();
  const userFetched = await UserModel.findOne({ email });
  if (userFetched) return "ALREADY_EXIST";

  if (imageFile) {
    const isProduction = process.platform === 'linux' || process.env.NODE_ENV === 'production';
    if (!isProduction) {
      await syncSignatureToVPS(imageFile);
    }
  }

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
  console.log('actulizando user', user)
  const userFetched = await UserModel.findOne({ _id: user.userId });
  if (!userFetched) return "USER_NOT_FOUND"; // Si el usuario no existe, retornar un mensaje

  if (imageFile) {
    const isProduction = process.platform === 'linux' || process.env.NODE_ENV === 'production';
    if (!isProduction) {
      await syncSignatureToVPS(imageFile);
    }
  }

  // Si se ha proporcionado una contraseña nueva, encriptarla, de lo contrario, mantener la actual
  const passHash = user.password ? await encrypt(user.password) : userFetched.password;

  try {
    // Actualizar los datos del usuario
    const updatedUser = await UserModel.updateOne(
      { _id: user.userId }, // Filtro para buscar al usuario
      {
        name: user.name || userFetched.name,
        email: user.email || userFetched.email,
        //password: passHash,
        profile: user.profile || userFetched.profile,
        permissions: user.permissions || userFetched.permissions,
        programs: user.programs || userFetched.programs,
        active: (typeof user.active === 'boolean') ? user.active : userFetched.active,
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
    console.log('userFetched', userFetched)
    if (!userFetched) return { status: false, msg: "No existe usuario" };

    if (userFetched.active === false) {
      return { status: false, msg: "Usuario desactivado. Contacte al administrador." };
    }

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
