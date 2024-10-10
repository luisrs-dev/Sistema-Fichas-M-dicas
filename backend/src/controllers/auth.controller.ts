import { Request, Response } from "express";
import { loginUser, registerNewUser, updateUser } from "../services/auth.service";

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

export { registerController, updateController, loginController };
