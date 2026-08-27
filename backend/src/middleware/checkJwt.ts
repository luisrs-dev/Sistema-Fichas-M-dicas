import { NextFunction, Request, Response } from "express";
import { verifyToken } from "../utils/jwt.handle";
import { JwtPayload } from "jsonwebtoken";
import UserModel from "../models/user.model";

interface RequestExt extends Request {
    user?: string | JwtPayload;
}

const checkJwt = (req: RequestExt, res: Response, next: NextFunction) => {
    try {

        const token = req.headers.authorization!.split(" ")[1];
        const decodedToken = verifyToken(token);

        if (typeof decodedToken === 'string') {
            return decodedToken;
        } else {
            req.user = { email: decodedToken.email || decodedToken.emailLowercase };
        }
        next();
    } catch (error) {
        res.status(400)
        res.send("UNAUTHORIZED")
    }
}

const checkAdmin = async (req: RequestExt, res: Response, next: NextFunction) => {
    try {
        const authorization = req.headers.authorization;
        if (!authorization?.startsWith("Bearer ")) {
            return res.status(401).json({ message: "Autenticación requerida" });
        }

        const decodedToken = verifyToken(authorization.slice(7));
        if (typeof decodedToken === "string") {
            return res.status(401).json({ message: "Token inválido" });
        }

        const email = decodedToken.email || decodedToken.emailLowercase;
        if (!email) {
            return res.status(401).json({ message: "Token inválido" });
        }

        const user = await UserModel.findOne({ email: String(email).toLowerCase() })
            .populate("permissions")
            .lean();
        const permissions = (user?.permissions || []) as any[];
        const isAdmin = permissions.some((permission) => permission?.value === "admin");

        if (!user || user.active === false || !isAdmin) {
            return res.status(403).json({ message: "Acceso exclusivo para administradores" });
        }

        req.user = { email };
        next();
    } catch (error) {
        return res.status(401).json({ message: "Token inválido o expirado" });
    }
};

export { checkJwt, checkAdmin }
