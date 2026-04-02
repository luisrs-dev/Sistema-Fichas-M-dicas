import { promises as fs } from "fs";
import path from "path";

/**
 * Retorna la ruta del ejecutable de Chrome/Chromium según el sistema operativo.
 * @returns {Promise<string>}
 */
export async function getSystemChromePath(): Promise<string> {
  const platform = process.platform;

  const chromePaths: Record<string, string[]> = {
    // macOS
    darwin: [
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      "/Applications/Chromium.app/Contents/MacOS/Chromium",
    ],
    // Windows
    win32: [
      path.join(process.env.PROGRAMFILES || "C:\\Program Files", "Google\\Chrome\\Application\\chrome.exe"),
      path.join(process.env["PROGRAMFILES(X86)"] || "C:\\Program Files (x86)", "Google\\Chrome\\Application\\chrome.exe"),
      path.join(process.env.LOCALAPPDATA || "", "Google\\Chrome\\Application\\chrome.exe"),
      "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
      "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    ],
    // Linux
    linux: [
      "/usr/bin/google-chrome",
      "/usr/bin/google-chrome-stable",
      "/usr/bin/chromium-browser",
      "/usr/bin/chromium",
      "/snap/bin/chromium",
    ],
  };

  const paths = chromePaths[platform] ?? [];

  if (paths.length === 0) {
    throw new Error(`[ChromePath] Plataforma no soportada para detección automática: ${platform}`);
  }

  for (const chromePath of paths) {
    try {
      await fs.access(chromePath);
      console.log(`[ChromePath] Chrome encontrado en: ${chromePath} (${platform})`);
      return chromePath;
    } catch {
      // Ruta no encontrada, se prueba la siguiente
    }
  }

  throw new Error(
    `[ChromePath] Chrome no encontrado en el sistema (${platform}).\n` +
    `Rutas probadas:\n${paths.map(p => `  - ${p}`).join("\n")}`
  );
}
