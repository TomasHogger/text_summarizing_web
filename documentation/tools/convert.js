const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const inputFilePath = process.argv[2];
const outputDir = process.argv[3];
const outputName = process.argv[4]

if (!inputFilePath || !outputDir || !outputName) {
  console.error('Usage: node convert.js <input-file> <output-dir> <output-file-name>');
  process.exit(1);
}

const absoluteInputFilePath = path.resolve(inputFilePath);
const outputFilePath = `${outputDir}/${outputName}.pdf`;

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

(async () => {
  const browser = await puppeteer.launch({
      headless: true,
      args: [
          "--disable-gpu",
          "--disable-dev-shm-usage",
          "--disable-setuid-sandbox",
          "--no-sandbox",
      ]
  });
  const page = await browser.newPage();
  await page.goto(`file://${absoluteInputFilePath}`, { waitUntil: 'networkidle0' });
  await page.pdf({ path: outputFilePath, format: 'A4' });
  await browser.close();
})();
