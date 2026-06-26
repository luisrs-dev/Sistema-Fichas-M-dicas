import { Browser, Page } from "puppeteer";
import moment from "moment";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { promises as fs } from "fs";
import path from "path";
import { getSystemChromePath } from "../utils/chromePath";

// Activar plugin Stealth para evadir detección anti-bot
puppeteer.use(StealthPlugin());

// Las rutas de Chrome se detectan dinámicamente según el sistema operativo en getSystemChromePath()

class Scrapper {
  protected browser: Browser | null = null;
  private isProduction: boolean;

  constructor() {
    this.isProduction = process.platform === 'linux' || process.env.NODE_ENV === 'production';
  }

  async getPage(): Promise<Page> {
    const browser: Browser = await this.launchBrowser();
    console.log("[Scrapper] Browser obtenido");

    const page: Page = await browser.newPage();

    console.log("[Scrapper] Página obtenida");

    // Propagar los console.log del navegador hacia la terminal de Node
    page.on("console", (msg) => {
      const type = msg.type();
      const text = msg.text();
      console.log(`[Browser::${type}] ${text}`);
    });
    page.on("pageerror", (error) => {
      console.error("[Browser::pageerror]", error);
    });

    // Autenticar proxy solo en producción (donde se usa iProyal)
    if (this.isProduction) {
      const proxyUser = process.env.PROXY_USER || "4y0YVHAHmRvZMtOx";
      const proxyPass = process.env.PROXY_PASS || "ZuVPtBuURBDDI6C9_country-cl_city-talca";
      await page.authenticate({
        username: proxyUser,
        password: proxyPass,
      });
    }

    // Ajustar el viewport para usar la pantalla completa del entorno disponible
    try {
      const viewport = await page.evaluate(() => ({
        width: window.screen?.availWidth || window.innerWidth || 1366,
        height: window.screen?.availHeight || window.innerHeight || 768,
      }));

      await page.setViewport({
        width: viewport.width,
        height: viewport.height,
      });
    } catch (error) {
      console.warn("[Scrapper] No fue posible detectar dimensiones de pantalla, usando fallback 1920x1080", error);
      await page.setViewport({ width: 1920, height: 1080 });
    }

    // User agent dinámico basado en la versión real de Chrome
    const browserVersion = await browser.version();
    const chromeVersionMatch = browserVersion.match(/Chrome\/(\d+\.\d+\.\d+\.\d+)/i)
      || browserVersion.match(/(\d+\.\d+\.\d+\.\d+)/);
    const chromeVersion = chromeVersionMatch ? chromeVersionMatch[1] : "131.0.6778.85";
    const userAgent = `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion} Safari/537.36`;
    console.log(`[Scrapper] User-Agent dinámico: ${userAgent}`);
    await page.setUserAgent(userAgent);

    // Bypass adicional antibot (complementa Stealth Plugin)
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, "webdriver", { get: () => false });
      // Ocultar que es headless Chrome
      Object.defineProperty(navigator, "plugins", {
        get: () => [1, 2, 3, 4, 5],
      });
      Object.defineProperty(navigator, "languages", {
        get: () => ["es-CL", "es", "en-US", "en"],
      });
      // Simular permisos de notificación normales
      const originalQuery = window.navigator.permissions.query;
      (window.navigator.permissions as any).query = (parameters: any) =>
        parameters.name === "notifications"
          ? Promise.resolve({ state: Notification.permission } as PermissionStatus)
          : originalQuery(parameters);
    });

    return page;
  }

  /**
   *
   * @param headless define si el navegador se levanta visualmente (false para visualizar)
   * @returns
   */
  async launchBrowser(headless: boolean = false): Promise<Browser> {

    const sessionHash = Date.now().toString();
    const userDataDir = await this.createCacheDirectory(sessionHash);

    console.log('[LaunchBrowser] Obteniendo browser...');
    console.log('isProduction', this.isProduction);
    console.log('process.platform', process.platform);
    console.log('process.env.NODE_ENV', process.env.NODE_ENV);


    if (this.isProduction) {
      console.log('[LaunchBrowser] Entorno Producción detectado (VPS)');

      const proxyHost = process.env.PROXY_HOST || "geo.iproyal.com:12321";

      this.browser = await puppeteer.launch({
        headless: true,
        userDataDir: userDataDir,
        executablePath: '/usr/bin/google-chrome',
        args: [
          `--proxy-server=http://${proxyHost}`,
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-gpu",
          "--use-gl=egl",
          "--disable-blink-features=AutomationControlled",
          "--disable-features=IsolateOrigins,site-per-process",
          "--window-size=1920,1080",
          "--lang=es-CL,es",
        ],
        defaultViewport: { width: 1920, height: 1080 },
        timeout: 0,
        protocolTimeout: 300000,
      });

    } else {
      console.log('[LaunchBrowser] Entorno Local detectado');

      const executablePath = await getSystemChromePath();

      this.browser = await puppeteer.launch({
        headless: headless,
        executablePath,
        //slowMo: 300, sirve para darle tiempe a cada operacion
        userDataDir: userDataDir, // Establecer la carpeta de caché,
        defaultViewport: null, // Dejar que el navegador maneje el viewport según el tamaño de la ventana
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--use-gl=egl",
          "--disable-blink-features=AutomationControlled",
          "--disable-dev-shm-usage",
          "--start-maximized",
          "--lang=es-CL,es",
        ],
        timeout: 0,
        protocolTimeout: 300000,
      });
    }

    console.log('[LaunchBrowser] Browser obtenido');
    const browserVersion = await this.browser.version();
    console.log("Browser version:", browserVersion);
    return this.browser;
  }

  async closeBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  // Método para manejar la navegación y selección de elementos comunes
  async navigateToPage(page: Page, url: string): Promise<void> {
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
  }

  async waitAndType(page: Page, selector: string, text: string): Promise<void> {
    await page.waitForSelector(selector, { visible: true });
    await page.type(selector, text);
  }

  async clickButton(page: Page, selector: string, timeoutValue: number = 5000): Promise<void> {
    try {
      await page.waitForSelector(selector, { visible: true, timeout: timeoutValue });

      // Asegurar que el elemento esté a la vista antes de clickear
      await page.evaluate((sel) => {
        const el = document.querySelector(sel);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, selector);

      await this.waitForSeconds(0.5);
      await page.click(selector);

    } catch (error) {
      console.error(`Error al hacer click en el selector: ${selector}`, error);
    }
  }

  async setDateValue(page: Page, selector: string, date: string): Promise<void> {
    this.waitForSeconds(1); // Esperar 1 segundo
    const formattedDate = this.normalizeDateInput(date);
    await page.evaluate(
      (selector, formattedDate) => {
        const input = document.querySelector(selector);
        if (input) {
          (input as HTMLInputElement).value = formattedDate;
          const event = new Event("input", { bubbles: true });
          input.dispatchEvent(event);
        } else {
          console.error(`El elemento con selector "${selector}" no fue encontrado.`);
        }
      },
      selector,
      formattedDate
    );
  }

  // Método para seleccionar un valor en un select
  async setSelectValue(page: Page, selector: string, value: string): Promise<void> {
    try {

      await page.waitForSelector(selector, { visible: true, timeout: 10000 });

      await page.evaluate(
        (selector, value) => {
          const select = document.querySelector(selector) as HTMLSelectElement;
          if (select) {
            select.value = value;
            const event = new Event("change", { bubbles: true }); // Despachar evento "change"
            select.dispatchEvent(event);
          } else {
            console.warn(`El elemento select con selector "${selector}" no fue encontrado.`);

          }
        },
        selector,
        value
      );
    } catch (error) {
      console.warn(`[Scrapper] setSelectValue omitido para ${selector}: ${error}`);

    }
  }

  // Método para seleccionar un radio button por su nombre y valor
  async setRadioValue(page: Page, name: string, value: string): Promise<void> {
    const selector = `input[name="${name}"][value="${value}"]`;
    try {
      await page.waitForSelector(selector, { visible: true, timeout: 10000 });
      await page.click(selector);
      console.log(`[Scrapper] Radio button "${name}" con valor "${value}" seleccionado.`);
    } catch (error) {
      console.warn(`[Scrapper] setRadioValue omitido para ${selector}: ${error}`);
    }
  }

  // Método actualizado con Moment.js para formatear la fecha
  formatDate(date: string): string {
    return moment(date).format("YYYY-MM-DD"); // Formato requerido para el input tipo fecha
  }

  // Método para esperar una cantidad de segundos
  async waitForSeconds(seconds: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
  }

  waitFor = async (page: Page, timeout?: number) => {
    await page.evaluate((timeout: any) => {
      return new Promise<void>((resolve) => {
        setTimeout(resolve, timeout || 500);
      });
    }, timeout);
  };

  private normalizeDateInput(date: string): string {
    if (!date) return date;

    const iso = moment(date, moment.ISO_8601, true);
    if (iso.isValid()) {
      return iso.format("DD/MM/YYYY");
    }

    const knownFormats = ["DD/MM/YYYY", "DD-MM-YYYY", "YYYY-MM-DD", "YYYY/MM/DD"];
    const parsed = moment(date, knownFormats, true);
    if (parsed.isValid()) {
      return parsed.format("DD/MM/YYYY");
    }

    return date;
  }

  private async createCacheDirectory(sessionHash: string): Promise<string> {
    const baseDir = "./cache";
    const userDataDir = path.join(baseDir, sessionHash);

    try {
      await fs.access(userDataDir);
    } catch (error) {
      await fs.mkdir(userDataDir, { recursive: true });
    }

    console.log({ userDataDir });

    return userDataDir;
  }

}

export default Scrapper;
