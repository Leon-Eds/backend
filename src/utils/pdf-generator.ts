import type { PaperFormat } from "puppeteer";
import handlebars from "handlebars";
import fs from "fs";
import path from "path";

// Helper to force true runtime ES module dynamic import under CommonJS output
const dynamicImport = new Function("modulePath", "return import(modulePath)");

export interface PdfOptions {
  format?: PaperFormat;
  width?: string;
  height?: string;
  landscape?: boolean;
  printBackground?: boolean;
  margin?: {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
  };
}

export class PdfGenerator {
  private static browserPromise: Promise<any> | null = null;

  private static async getBrowser(): Promise<any> {
    if (!this.browserPromise) {
      this.browserPromise = (async () => {
        let puppeteerModule: any;
        try {
          puppeteerModule = await dynamicImport("puppeteer");
        } catch (err1) {
          try {
            puppeteerModule = await dynamicImport("puppeteer-core");
          } catch (err2) {
            throw new Error(`Failed to dynamically import puppeteer module: ${err1}`);
          }
        }

        const puppeteer = puppeteerModule.default || puppeteerModule;

        const launchOptions: any = {
          headless: true,
          args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--single-process", "--no-zygote"],
        };

        // If deployed in a serverless environment (e.g. Vercel/Lambda) with @sparticuz/chromium
        try {
          const chromiumModule = await dynamicImport("@sparticuz/chromium");
          const chromium = chromiumModule.default || chromiumModule;
          launchOptions.executablePath = await chromium.executablePath();
          launchOptions.args = chromium.args || launchOptions.args;
        } catch (_) {
          // Default standard puppeteer browser launch
        }

        return puppeteer.launch(launchOptions);
      })().catch((err) => {
        this.browserPromise = null;
        throw err;
      });
    }
    return this.browserPromise;
  }

  public static async renderTemplateToPdf(
    templateName: string,
    data: Record<string, any>,
    options: PdfOptions = {}
  ): Promise<Buffer> {
    const templatePath = path.join(__dirname, "../templates/pdf", `${templateName}.hbs`);
    if (!fs.existsSync(templatePath)) {
      throw new Error(`PDF Template not found: ${templatePath}`);
    }

    const templateSource = fs.readFileSync(templatePath, "utf-8");
    const compiledTemplate = handlebars.compile(templateSource);
    const htmlContent = compiledTemplate(data);

    const browser = await this.getBrowser();
    const page = await browser.newPage();

    try {
      await page.setContent(htmlContent, { waitUntil: "domcontentloaded" });

      const pdfBuffer = await page.pdf({
        format: options.format,
        width: options.width,
        height: options.height,
        landscape: options.landscape || false,
        printBackground: options.printBackground ?? true,
        margin: options.margin || { top: "0px", right: "0px", bottom: "0px", left: "0px" },
      });

      return Buffer.from(pdfBuffer);
    } finally {
      await page.close();
    }
  }
}
