
import fs from 'fs';
import path from 'path';


export const getBase64Image = (relativePath: string, type: "png" | "jpeg" = "png") => {
  let imagePath = relativePath;

  // Determinar el tipo basado en la extensión si es posible
  const ext = path.extname(relativePath).toLowerCase();
  const imageType = ext === ".jpg" || ext === ".jpeg" ? "jpeg" : "png";

  // Si no es una ruta absoluta, construirla
  if (!path.isAbsolute(imagePath)) {
    // Si ya incluye 'uploads', no volver a añadirlo
    if (imagePath.startsWith('uploads/')) {
      imagePath = path.join(process.cwd(), imagePath);
    } else {
      imagePath = path.join(process.cwd(), "uploads", imagePath);
    }
  }

  // Si no existe en la ruta calculada, probar en la ruta absoluta del VPS como fallback
  if (!fs.existsSync(imagePath)) {
    const vpsFallbackPath = path.join("/home/repositories/ficlin/backend/uploads", relativePath.replace(/^(\/)?uploads\//, ""));
    if (fs.existsSync(vpsFallbackPath)) {
      imagePath = vpsFallbackPath;
    }
  }

  if (!fs.existsSync(imagePath)) {
    console.error(`[getBase64Image] Image not found at: ${imagePath}`);
    return null;
  }

  const fileData = fs.readFileSync(imagePath, { encoding: "base64" });
  return `data:image/${imageType};base64,${fileData}`;
};