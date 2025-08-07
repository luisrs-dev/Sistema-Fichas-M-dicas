import { Router } from "express";
import multer from "multer";
import {loginController, registerController, updateController, updatePasswordController} from "../controllers/auth.controller";
import path from 'path';
import fs from 'fs';

const uploadsDir = path.resolve(__dirname, '../../uploads');

if (!fs.existsSync(uploadsDir)) {
  console.log(`No existe directorio ${uploadsDir}, creando directorio.`);
  fs.mkdirSync(uploadsDir);
}

const router = Router();
// Configuración de Multer para guardar archivos
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadsDir); // Directorio donde se guardarán las imágenes
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + '-' + file.originalname); // Renombrar el archivo para evitar duplicados
    }
  });
  
const upload = multer({ storage: storage });

router.post("/update-password", updatePasswordController);
router.post("/login", loginController);
router.post("/register", upload.single('image'), registerController);
router.put("/update-password", updatePasswordController);
router.put("/update", upload.single('image'), updateController);


export { router };
