import { Request, Response } from "express";
import { loginUser, registerNewUser, updateUser, updateUserPassword } from "../services/auth.service";

const registerController = async (req: Request, res: Response) => {

  const imageFile = req.file; // Accede al objeto req.file  
  const { body } = req; 
  const responseUser = await registerNewUser(body, imageFile);
  res.send({status:'ok', responseUser});
};

const updateController = async (req: Request, res: Response) => {
  console.log('UPDATING...');
  
  const imageFile = req.file; // Accede al objeto req.file  
  const { body } = req;    
  const responseUser = await updateUser(body, imageFile);
  res.send({status:'ok', responseUser});
};

const updatePasswordController = async (req: Request, res: Response) => {
  try {
    const { id, password } = req.body;

    if (!id || !password) {
      return res.status(400).json({ status: 'error', message: 'Id y nueva contraseña son requeridos' });
    }

    const result = await updateUserPassword(id, password);

    if (result === 'USER_NOT_FOUND') {
      return res.status(404).json({ status: 'error', message: 'Usuario no encontrado' });
    }

    res.json({ status: 'ok', message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    console.error("Error actualizando contraseña:", error);
    res.status(500).json({ status: 'error', message: 'Error interno del servidor' });
  }
};


const loginController = async ({ body }: Request, res: Response) => {
  const { email, password } = body;
  const responseUser = await loginUser({ email, password });
  console.log({responseUser});
  
  if (!responseUser.status) {
    res.status(403).send(responseUser);
  } else {
    res.send(responseUser);
  }
};

export { registerController, updateController, loginController, updatePasswordController };
