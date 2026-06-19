import { Router } from "express";
import multer from "multer";
import { loginController, registerController, updateController, updatePasswordController } from "../controllers/auth.controller";
import path from 'path';
import fs from 'fs';

const uploadsDir = path.resolve(process.cwd(), 'uploads');

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
    // Si viene el header 'x-original-filename', conservar el nombre original enviado por la sincronización
    const originalFilename = req.headers['x-original-filename'];
    if (originalFilename && typeof originalFilename === 'string') {
      cb(null, originalFilename);
    } else {
      cb(null, Date.now() + '-' + file.originalname); // Renombrar el archivo para evitar duplicados
    }
  }
});

const upload = multer({ storage: storage });

router.post("/update-password", updatePasswordController);
router.post("/login", loginController);
router.post("/register", upload.single('image'), registerController);
router.put("/update-password", updatePasswordController);
router.put("/update", upload.single('image'), updateController);
router.post("/sync-signature", upload.single('image'), (req, res) => {
  res.status(200).json({ status: "ok", filename: req.file?.filename });
});


export { router };
