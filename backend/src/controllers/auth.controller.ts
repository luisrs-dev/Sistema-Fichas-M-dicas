import { Request, Response } from "express";
import { loginUser, registerNewUser } from "../services/auth.service";

const registerController = async ({ body }: Request, res: Response) => {
  const responseUser = await registerNewUser(body);
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

export { registerController, loginController };
