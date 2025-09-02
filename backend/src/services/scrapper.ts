import { Browser, Page } from "puppeteer";
//import puppeteer from "puppeteer-extra";
import puppeteer from "puppeteer";
import moment from "moment";

//import StealthPlugin from "puppeteer-extra-plugin-stealth";
//import AnonymizeUAPlugin from "puppeteer-extra-plugin-anonymize-ua";
import path from "path";
import { promises as fs } from "fs";

class Scrapper {
  protected browser: Browser | null = null;

  async getPage(): Promise<Page> {
    const browser: Browser = await this.launchBrowser(false);
    const page: Page = await browser.newPage();
    await page.setDefaultNavigationTimeout(300000); // 5 minutos

    // Ajustar el viewport para simular una pantalla de notebook
    await page.setViewport({
      width: 1366, // Ancho de un notebook común
      height: 768, // Alto de un notebook común
    });

    return page;
  }

  /**
   *
   * @param headless define si el navegador se levanta visualmente (false para visualizar)
   * @returns
   */
  async launchBrowser(headless: boolean = true): Promise<Browser> {
    //puppeteer.use(StealthPlugin());
    //puppeteer.use(AnonymizeUAPlugin());

    const sessionHash = Date.now().toString();
    const userDataDir = await this.createCacheDirectory(sessionHash);

    this.browser = await puppeteer.launch(
      {
      headless: headless,
      //slowMo: 300, sirve para darle tiempe a cada operacion
      userDataDir: userDataDir, // Establecer la carpeta de caché
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--use-gl=egl",
        "--blink-settings=imagesEnabled=false,cssEnabled=false",
        "--disable-dev-shm-usage"
      ],
      timeout: 0,
      protocolTimeout: 300000,
    }
  );

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
    await page.goto(url, { waitUntil: "networkidle0" });
    //await page.goto(url, { waitUntil: 'networkidle2' });
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
    await page.evaluate(
      (selector, date) => {
        const input = document.querySelector(selector);
        if (input) {
          (input as HTMLInputElement).value = date;
          const event = new Event("input", { bubbles: true });
          input.dispatchEvent(event);
        } else {
          console.error(`El elemento con selector "${selector}" no fue encontrado.`);
        }
      },
      selector,
      date
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
            console.error(`El elemento select con selector "${selector}" no fue encontrado.`);
            throw new Error(`Elemento select no encontrado: ${selector}`);

          }
        },
        selector,
        value
      );
    } catch (error) {
      throw new Error(`Error al setear valor de select: ${error}`);
      
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
