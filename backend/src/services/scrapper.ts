import { Browser, Page } from "puppeteer";
//import puppeteer from "puppeteer-extra";
import moment from "moment";
import puppeteer from "puppeteer-extra";

//import StealthPlugin from "puppeteer-extra-plugin-stealth";
//import AnonymizeUAPlugin from "puppeteer-extra-plugin-anonymize-ua";
import { promises as fs } from "fs";
import path from "path";

const SYSTEM_CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";


class Scrapper {
  protected browser: Browser | null = null;

  async getPage(): Promise<Page> {
    const browser: Browser = await this.launchBrowser();
    console.log('[Scrapper] Browser obtenido');

    const page: Page = await browser.newPage();

    console.log('[Scrapper] Página obtenida');
    
    // Propagar los console.log del navegador hacia la terminal de Node
    page.on('console', (msg) => {
      const type = msg.type();
      const text = msg.text();
      console.log(`[Browser::${type}] ${text}`);
    });
    page.on('pageerror', (error) => {
      console.error('[Browser::pageerror]', error);
    });


    await page.authenticate({
    username: "4y0YVHAHmRvZMtOx",
    password: "ZuVPtBuURBDDI6C9_country-cl_city-talca",
  });
    // await page.setDefaultNavigationTimeout(300000); // 5 minutos

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

    // User agent realista
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
      "(KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36"
    );
    
    
    // Bypass básico antibot
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, "webdriver", { get: () => false });
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
    // const userDataDir = await this.createCacheDirectory(sessionHash);
    const userDataDir = await this.createCacheDirectory(sessionHash);
    const executablePath = await this.getSystemChromePath();

    console.log('[LaunchBrowser] Obteniendo browser...');
    
    this.browser =  await puppeteer.launch(
      
      // Prod
      {
        userDataDir: userDataDir,
        executablePath: '/usr/bin/google-chrome',
        args: [
          `--proxy-server=http://${"geo.iproyal.com:12321"}`,
          "--no-sandbox",
          "--disable-setuid-sandbox",
        ],
      }
      // Local
      // {
      //   headless: headless,
      //   executablePath,
      //   //slowMo: 300, sirve para darle tiempe a cada operacion
      //   userDataDir: userDataDir, // Establecer la carpeta de caché,
      //   args: [
      //     "--no-sandbox",
      //     "--disable-setuid-sandbox",
      //     "--use-gl=egl",
      //     "--blink-settings=imagesEnabled=false,cssEnabled=false",
      //     "--disable-dev-shm-usage"
      //   ],
      //   timeout: 0,
      //   protocolTimeout: 300000,
      // }
      );

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

  private async getSystemChromePath(): Promise<string> {
    try {
      await fs.access(SYSTEM_CHROME_PATH);
      console.log(`[LaunchBrowser] Usando Chrome del sistema: ${SYSTEM_CHROME_PATH}`);
      return SYSTEM_CHROME_PATH;
    } catch {
      throw new Error(`[LaunchBrowser] Chrome no encontrado en ${SYSTEM_CHROME_PATH}`);
    }
  }

}

export default Scrapper;
