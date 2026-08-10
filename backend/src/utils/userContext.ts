import { Request } from "express";
import { verifyToken } from "./jwt.handle";

export interface UserContext {
  userId?: string;
  userEmail?: string;
  userName?: string;
}

export const extractUserContext = (req: Request): UserContext => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      const decoded: any = verifyToken(token);

      if (decoded && typeof decoded === "object") {
        const userEmail = decoded.emailLowercase || decoded.email || decoded.id;
        return {
          userEmail,
          userName: userEmail,
        };
      }
    }
  } catch (error) {
    // Si falla o no viene token, caer en fallback de sistema
  }

  return {
    userEmail: "sistema",
    userName: "Sistema / Tarea Automática",
  };
};
