import fs from 'fs';
import path from 'path';
import http from 'http';
import https from 'https';

/**
 * Auxiliar para descargar una imagen desde una URL y retornar su base64.
 * Sigue redirecciones automáticamente (máximo 3).
 */
const fetchImageAsBase64 = (url: string, redirectsRemaining = 3): Promise<string | null> => {
  return new Promise((resolve) => {
    if (redirectsRemaining <= 0) {
      resolve(null);
      return;
    }

    const client = url.startsWith('https') ? https : http;
    client.get(url, (res) => {
      // Manejar redirecciones (301, 302, etc.)
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        try {
          const redirectUrl = new URL(res.headers.location, url).toString();
          resolve(fetchImageAsBase64(redirectUrl, redirectsRemaining - 1));
          return;
        } catch (e) {
          resolve(null);
          return;
        }
      }

      if (res.statusCode !== 200) {
        resolve(null);
        return;
      }

      const data: Buffer[] = [];
      res.on('data', (chunk) => data.push(chunk));
      res.on('end', () => {
        const buffer = Buffer.concat(data);
        resolve(buffer.toString('base64'));
      });
    }).on('error', (err) => {
      console.error(`[getBase64Image] Error al obtener desde VPS URL ${url}:`, err.message);
      resolve(null);
    });
  });
};

export const getBase64Image = async (relativePath: string, type: "png" | "jpeg" = "png"): Promise<string | null> => {
  // 1. Normalizar separadores de ruta a formato POSIX (barras diagonales) para consistencia en cualquier SO
  let normalizedPath = relativePath.replace(/\\/g, '/');

  // Determinar el tipo basado en la extensión si es posible
  const ext = path.extname(normalizedPath).toLowerCase();
  const imageType = ext === ".jpg" || ext === ".jpeg" ? "jpeg" : "png";

  // Quitar el prefijo /uploads/ o uploads/ si viene con él para construir rutas de forma limpia
  normalizedPath = normalizedPath.replace(/^(\/)?uploads\//, "");

  // 2. Intentar descargar desde el VPS primero
  const vpsUrl = `http://ficlin.cl/uploads/${normalizedPath}`;
  console.log(`[getBase64Image] Intentando descargar desde el VPS: ${vpsUrl}`);
  const vpsBase64 = await fetchImageAsBase64(vpsUrl);
  if (vpsBase64) {
    return `data:image/${imageType};base64,${vpsBase64}`;
  }

  // 3. Fallback: Construir la ruta absoluta local en el proyecto
  let imagePath = path.join(process.cwd(), "uploads", normalizedPath);

  // Si no existe en la ruta local, probar en la ruta absoluta del VPS como fallback (cuando se ejecuta en producción)
  if (!fs.existsSync(imagePath)) {
    const vpsFallbackPath = path.join("/home/repositories/ficlin/backend/uploads", normalizedPath);
    if (fs.existsSync(vpsFallbackPath)) {
      imagePath = vpsFallbackPath;
    }
  }

  if (!fs.existsSync(imagePath)) {
    console.error(`[getBase64Image] Imagen no encontrada localmente ni en VPS en: ${imagePath}`);
    return null;
  }

  try {
    const fileData = fs.readFileSync(imagePath, { encoding: "base64" });
    return `data:image/${imageType};base64,${fileData}`;
  } catch (error: any) {
    console.error(`[getBase64Image] Error al leer archivo local:`, error.message);
    return null;
  }
};