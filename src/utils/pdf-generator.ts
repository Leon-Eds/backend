import type { PaperFormat } from "puppeteer";
import handlebars from "handlebars";
import fs from "fs";
import path from "path";

// Dummy static references to force Vercel NFT / bundlers to include dependencies in deployment package
if (process.env.VERCEL_NFT_DUMMY) {
  try {
    require("puppeteer");
    require("puppeteer-core");
    require("@sparticuz/chromium");
  } catch (_) {}
}

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
        const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.AWS_EXECUTION_ENV);

        if (isServerless) {
          try {
            const chromiumModule = await dynamicImport("@sparticuz/chromium");
            const puppeteerCoreModule = await dynamicImport("puppeteer-core");
            const chromium = chromiumModule.default || chromiumModule;
            const puppeteerCore = puppeteerCoreModule.default || puppeteerCoreModule;

            return await puppeteerCore.launch({
              args: chromium.args,
              defaultViewport: chromium.defaultViewport,
              executablePath: await chromium.executablePath(),
              headless: chromium.headless,
            });
          } catch (serverlessError) {
            console.warn("[PdfGenerator] Serverless chromium launch failed, falling back to standard puppeteer:", serverlessError);
          }
        }

        // Standard / Local environment launch
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
        return await puppeteer.launch({
          headless: true,
          args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--single-process", "--no-zygote"],
        });
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
    let templatePath = path.join(__dirname, "../templates/pdf", `${templateName}.hbs`);
    if (!fs.existsSync(templatePath)) {
      templatePath = path.join(process.cwd(), "src/templates/pdf", `${templateName}.hbs`);
    }
    if (!fs.existsSync(templatePath)) {
      templatePath = path.join(process.cwd(), "dist/templates/pdf", `${templateName}.hbs`);
    }
    if (!fs.existsSync(templatePath)) {
      throw new Error(`PDF Template not found: ${templateName}.hbs (searched ${templatePath})`);
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
