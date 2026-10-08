/**
 * Institution Admin - branding
 * Split out of the former institutionAdminController.js monolith; see ../../../../CODE_STANDARDS.md
 */
const { AppError, asyncHandler } = require('../../middleware/errorHandler');
const Institution = require('../../models/Institution');

function decodeBase64DataUri(dataUri) {
  const payload = String(dataUri || '').split(',')[1] || '';
  if (!payload || !/^[A-Za-z0-9+/=\s]+$/.test(payload)) return null;
  return Buffer.from(payload, 'base64');
}

function isValidImageBuffer(buffer) {
  if (!buffer || buffer.length < 12) return false;
  const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  const isPng = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
  const isGif = buffer.toString('ascii', 0, 4) === 'GIF8';
  const isWebp = buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP';
  return isJpeg || isPng || isGif || isWebp;
}

/**
 * Update Institution Branding
 * @route PUT /api/institution-admin/branding
 * @access Private (Institution Admin)
 */
const updateBranding = asyncHandler(async (req, res, next) => {
  const institutionId = req.institutionId;
  const { primaryColor, secondaryColor, logoUrl, customDomain } = req.body;

  const institution = await Institution.findById(institutionId);
  if (!institution) {
    throw new AppError('Institution not found', 404, 'RESOURCE_NOT_FOUND');
  }

  if (primaryColor) institution.branding.primaryColor = primaryColor;
  if (secondaryColor) institution.branding.secondaryColor = secondaryColor;
  if (logoUrl !== undefined) institution.branding.logoUrl = logoUrl;
  if (customDomain !== undefined) institution.branding.customDomain = customDomain;

  await institution.save();

  res.status(200).json({
    success: true,
    message: 'Branding updated successfully',
    data: {
      branding: institution.branding
    }
  });
});

/**
 * Upload Logo for Institution Branding
 * @route POST /api/institution-admin/branding/upload-logo
 * @access Private (Institution Admin)
 */
const uploadLogo = asyncHandler(async (req, res, next) => {
  const institutionId = req.institutionId;
  const { image } = req.body;

  if (!image) {
    throw new AppError('Image data is required', 400, 'VALIDATION_ERROR');
  }

  if (!image.startsWith('data:image/')) {
    throw new AppError('Invalid image format. Must be base64 encoded image.', 400, 'VALIDATION_ERROR');
  }

  if (!isValidImageBuffer(decodeBase64DataUri(image))) {
    throw new AppError('Invalid image format. Must be a genuine image file.', 400, 'VALIDATION_ERROR');
  }

  const sizeInBytes = (image.length * 3) / 4;
  const sizeInMB = sizeInBytes / (1024 * 1024);
  
  if (sizeInMB > 10) {
    throw new AppError(`Image too large (${sizeInMB.toFixed(1)}MB). Maximum size is 10MB.`, 400, 'VALIDATION_ERROR');
  }

  const cloudinaryService = require('../services/cloudinaryService');
  const result = await cloudinaryService.uploadImage(image, 'inavora/institution-logos');

  const institution = await Institution.findById(institutionId);
  if (!institution) {
    throw new AppError('Institution not found', 404, 'RESOURCE_NOT_FOUND');
  }

  institution.branding.logoUrl = result.url;
  await institution.save();

  res.status(200).json({
    success: true,
    message: 'Logo uploaded successfully',
    data: {
      logoUrl: result.url,
      publicId: result.publicId
    }
  });
});

module.exports = {
  updateBranding,
  uploadLogo
};
