import { promises as fs } from "fs";
import path from "path";

class ProcessLogger {
  private readonly filePath: string;
  private dirReady = false;

  constructor(patientName: string, processName: string) {
    const timestamp = this.buildTimestamp();
    const normalizedName = this.normalize(patientName || "sin-nombre");
    const normalizedProcess = this.normalize(processName || "proceso");
    const logsDir = path.resolve(__dirname, "..", "..", "logs");
    this.filePath = path.join(logsDir, `${normalizedName}_${normalizedProcess}_${timestamp}.log`);
    console.log('filepath', this.filePath);
    
  }

  private normalize(value: string): string {
    return value
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-_]/g, "")
      .replace(/-{2,}/g, "-")
      .replace(/^-+|-+$/g, "") || "registro";
  }

  private buildTimestamp(): string {
    const now = new Date();
    const pad = (num: number) => num.toString().padStart(2, "0");

    return [
      now.getFullYear(),
      pad(now.getMonth() + 1),
      pad(now.getDate()),
    ].join("") + `-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  }

  private async ensureDir() {
    if (this.dirReady) return;
    const dir = path.dirname(this.filePath);
    await fs.mkdir(dir, { recursive: true });
    this.dirReady = true;
  }

  async log(message: string) {
    await this.ensureDir();
    const line = `[${new Date().toISOString()}] ${message}\n`;
    await fs.appendFile(this.filePath, line, { encoding: "utf8" });
  }

  async close() {
    // Método reservado por compatibilidad. Con appendFile no hay recursos abiertos.
    return Promise.resolve();
  }

  get path(): string {
    return this.filePath;
  }
}

export default ProcessLogger;
