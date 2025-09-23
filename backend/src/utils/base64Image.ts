
import fs from 'fs';
import path from 'path';


export const getBase64Image = (relativePath: string, type: "png" | "jpeg" = "png") => {
  const imagePath = path.join(__dirname, "../../uploads", relativePath);
  if (!fs.existsSync(imagePath)) return null;
  const fileData = fs.readFileSync(imagePath, { encoding: "base64" });
  return `data:image/${type};base64,${fileData}`;
};