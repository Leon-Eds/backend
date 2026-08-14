import puppeteer, { Browser, PaperFormat } from "puppeteer";
import handlebars from "handlebars";
import fs from "fs";
import path from "path";

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
  private static browserPromise: Promise<Browser> | null = null;

  private static async getBrowser(): Promise<Browser> {
    if (!this.browserPromise) {
      this.browserPromise = puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
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
