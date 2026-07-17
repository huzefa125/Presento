const cloudinaryService = require('./cloudinaryService');
const Logger = require('../utils/logger');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

// Use pdf-to-img library which is designed for Node.js and doesn't have canvas compatibility issues
let pdfToImg = null;

async function loadPdfToImg() {
  if (!pdfToImg) {
    try {
      // Dynamic import for ES module
      // pdf-to-img exports 'pdf' as a named export
      const pdfToImgModule = await import('pdf-to-img');
      pdfToImg = pdfToImgModule.pdf;
      if (!pdfToImg) {
        throw new Error('pdf export not found in pdf-to-img module');
      }
    } catch (error) {
      Logger.error('Failed to load pdf-to-img library', error);
      throw new Error(`Failed to load pdf-to-img library: ${error.message}`);
    }
  }
  return pdfToImg;
}

/**
 * Convert PDF pages to images using pdf-to-img library (Node.js compatible)
 * @param {string} pdfUrl - URL of the PDF file
 * @param {string} pdfBase64 - Base64 encoded PDF (optional, if provided, use this instead of URL)
 * @param {string} pdfPublicId - Cloudinary public ID (not used, kept for compatibility)
 * @returns {Promise<Array>} Array of page images with URLs and public IDs
 */
async function convertPdfPagesToImages(pdfUrl, pdfBase64 = null, pdfPublicId = null) {
  let tempPdfPath = null;
  
  try {
    // Load pdf-to-img library
    const pdf = await loadPdfToImg();
    
    let pdfPath;
    
    if (pdfBase64) {
      // Remove data URL prefix if present
      const base64Data = pdfBase64.includes(',') ? pdfBase64.split(',')[1] : pdfBase64;
      const pdfBuffer = Buffer.from(base64Data, 'base64');
      
      // Create temporary file for pdf-to-img (it needs a file path)
      const tempDir = os.tmpdir();
      tempPdfPath = path.join(tempDir, `pdf_${Date.now()}_${Math.random().toString(36).substring(7)}.pdf`);
      await fs.writeFile(tempPdfPath, pdfBuffer);
      pdfPath = tempPdfPath;
    } else if (pdfUrl) {
      // For URL, we need to download it first or use it directly if it's a local path
      // For now, assume pdfUrl is a Cloudinary URL and we need to download it
      // In production, you might want to download from URL first
      throw new Error('PDF URL conversion not yet implemented. Please use base64 PDF.');
    } else {
      throw new Error('Either pdfUrl or pdfBase64 must be provided');
    }

    Logger.info(`Converting PDF from ${pdfBase64 ? 'base64' : 'URL'} to images`);

    const pageImages = [];
    let pageNum = 1;

    // Use pdf-to-img to convert PDF pages to images
    // pdf-to-img returns an async iterator
    const document = await pdf(pdfPath, { scale: 2.0 }); // Scale 2.0 for better quality
    
    for await (const image of document) {
      try {
        // image is a Buffer containing PNG data
        const imageBuffer = image;

        // Upload page image to Cloudinary
        const uploadResult = await cloudinaryService.uploadPdfPageImage(imageBuffer);

        pageImages.push({
          pageNumber: pageNum,
          imageUrl: uploadResult.url,
          imagePublicId: uploadResult.publicId
        });

        Logger.info(`Converted page ${pageNum}`);
        pageNum++;
      } catch (pageError) {
        Logger.error(`Error processing page ${pageNum}`, {
          error: pageError.message,
          stack: pageError.stack
        });
        // Continue with other pages even if one fails
        pageNum++;
      }
    }

    if (pageImages.length === 0) {
      throw new Error('No pages could be converted from PDF');
    }

    Logger.info(`Successfully converted ${pageImages.length} pages from PDF`);
    return pageImages;
  } catch (error) {
    Logger.error('Error converting PDF pages to images', error);
    throw new Error(`Failed to convert PDF pages: ${error.message}`);
  } finally {
    // Clean up temporary PDF file if created
    if (tempPdfPath) {
      try {
        await fs.unlink(tempPdfPath);
        Logger.info(`Cleaned up temporary PDF file: ${tempPdfPath}`);
      } catch (cleanupError) {
        Logger.warn(`Error cleaning up temporary PDF file: ${tempPdfPath}`, cleanupError.message);
      }
    }
  }
}

module.exports = {
  convertPdfPagesToImages
};

