import { Router } from "express";
import multer from "multer";
import {loginController, registerController, updateController} from "../controllers/auth.controller";

const router = Router();
// Configuración de Multer para guardar archivos
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'src/uploads/'); // Directorio donde se guardarán las imágenes
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + '-' + file.originalname); // Renombrar el archivo para evitar duplicados
    }
  });
  
const upload = multer({ storage: storage });

router.post("/login", loginController);
router.post("/register", upload.single('image'), registerController);
router.put("/update", upload.single('image'), updateController);

export { router };
