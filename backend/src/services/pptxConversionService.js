const { execFile } = require('child_process');
const util = require('util');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const pdfConversionService = require('./pdfConversionService');
const Logger = require('../utils/logger');

const execFileAsync = util.promisify(execFile);

/**
 * Resolve the LibreOffice `soffice` binary path.
 * - LIBREOFFICE_PATH env var always wins (set this in production if soffice isn't on PATH).
 * - On Windows, fall back to the default install location.
 * - Elsewhere, rely on `soffice` being on PATH (installed via apt/brew/etc).
 */
function resolveSofficePath() {
  if (process.env.LIBREOFFICE_PATH) return process.env.LIBREOFFICE_PATH;
  if (process.platform === 'win32') {
    return 'C:\\Program Files\\LibreOffice\\program\\soffice.exe';
  }
  return 'soffice';
}

/**
 * Convert a PowerPoint (.ppt/.pptx) file to per-slide images.
 * Pipeline: pptx -> pdf (LibreOffice headless) -> images (reuses pdfConversionService).
 * @param {string} pptxBase64 - Base64 encoded PowerPoint file (data URI or raw base64)
 * @returns {Promise<Array>} Array of { pageNumber, imageUrl, imagePublicId }
 */
async function convertPptxPagesToImages(pptxBase64) {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'pptx_'));
  const inputPath = path.join(tempDir, 'input.pptx');

  try {
    const base64Data = pptxBase64.includes(',') ? pptxBase64.split(',')[1] : pptxBase64;
    await fs.writeFile(inputPath, Buffer.from(base64Data, 'base64'));

    const soffice = resolveSofficePath();
    Logger.info('Converting PowerPoint to PDF via LibreOffice', { soffice, tempDir });

    await execFileAsync(
      soffice,
      ['--headless', '--norestore', '--convert-to', 'pdf', '--outdir', tempDir, inputPath],
      { timeout: 120000 }
    );

    const pdfPath = path.join(tempDir, 'input.pdf');
    const pdfBuffer = await fs.readFile(pdfPath);
    const pdfBase64 = `data:application/pdf;base64,${pdfBuffer.toString('base64')}`;

    const pageImages = await pdfConversionService.convertPdfPagesToImages(null, pdfBase64);

    Logger.info(`Successfully converted PowerPoint to ${pageImages.length} slide images`);
    return pageImages;
  } catch (error) {
    Logger.error('Error converting PowerPoint to images', error);
    throw new Error(`Failed to convert PowerPoint: ${error.message}`);
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
  }
}

module.exports = { convertPptxPagesToImages };
