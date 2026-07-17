const cloudinaryService = require('../services/cloudinaryService');
const pdfConversionService = require('../services/pdfConversionService');
const Image = require('../models/Image');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const Logger = require('../utils/logger');

/**
 * Upload image to Cloudinary
 * @route POST /api/upload/image
 * @access Private
 * @param {string} req.body.image - Base64 encoded image data
 * @returns {Object} Uploaded image URL and public ID
 */
const uploadImage = asyncHandler(async (req, res, next) => {
  const { image } = req.body;
  const userId = req.userId;

  if (!image) {
    throw new AppError('Image data is required', 400, 'VALIDATION_ERROR');
  }

  if (!image.startsWith('data:image/')) {
    throw new AppError('Invalid image format. Must be base64 encoded image.', 400, 'VALIDATION_ERROR');
  }

  const sizeInBytes = (image.length * 3) / 4;
  const sizeInMB = sizeInBytes / (1024 * 1024);
  
  if (sizeInMB > 10) {
    throw new AppError(`Image too large (${sizeInMB.toFixed(1)}MB). Maximum size is 10MB.`, 400, 'VALIDATION_ERROR');
  }

  const result = await cloudinaryService.uploadImage(image);

  const imageRecord = new Image({
    userId,
    imageUrl: result.url,
    publicId: result.publicId
  });
  await imageRecord.save();

  res.status(200).json({
    success: true,
    message: 'Image uploaded successfully',
    data: {
      imageUrl: result.url,
      publicId: result.publicId
    }
  });
});

/**
 * Delete image from Cloudinary
 * @route DELETE /api/upload/image
 * @access Private
 * @param {string} req.body.publicId - Cloudinary public ID
 * @returns {Object} Success message
 */
const deleteImage = asyncHandler(async (req, res, next) => {
  const { publicId } = req.body;
  const userId = req.userId;

  if (!publicId) {
    throw new AppError('Public ID is required', 400, 'VALIDATION_ERROR');
  }

  const imageRecord = await Image.findOne({ publicId });

  if (!imageRecord) {
    throw new AppError('Image not found', 404, 'RESOURCE_NOT_FOUND');
  }

  if (imageRecord.userId.toString() !== userId.toString()) {
    throw new AppError('You do not have permission to delete this image', 403, 'FORBIDDEN');
  }

  await cloudinaryService.deleteImage(publicId);
  await Image.deleteOne({ publicId });

  res.status(200).json({
    success: true,
    message: 'Image deleted successfully'
  });
});

/**
 * Get user's uploaded images
 * @route GET /api/upload/images
 * @access Private
 * @returns {Object} Array of user's uploaded images
 */
const getUserImages = asyncHandler(async (req, res, next) => {
  const userId = req.userId;

  const images = await Image.find({ userId })
    .sort({ uploadedAt: -1 })
    .select('imageUrl publicId uploadedAt')
    .lean();

  res.status(200).json({
    success: true,
    data: images
  });
});

/**
 * Upload video to Cloudinary
 * @route POST /api/upload/video
 * @access Private
 * @param {string} req.body.video - Base64 encoded video data
 * @returns {Object} Uploaded video URL and public ID
 */
const uploadVideo = asyncHandler(async (req, res, next) => {
  const { video } = req.body;
  const userId = req.userId;

  // Validate userId
  if (!userId) {
    Logger.error('Video upload attempted without userId');
    throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
  }

  if (!video) {
    throw new AppError('Video data is required', 400, 'VALIDATION_ERROR');
  }

  if (!video.startsWith('data:video/')) {
    throw new AppError('Invalid video format. Must be base64 encoded video.', 400, 'VALIDATION_ERROR');
  }

  // Validate base64 data is not empty
  const base64Data = video.split(',')[1];
  if (!base64Data || base64Data.length === 0) {
    throw new AppError('Video data is empty or invalid', 400, 'VALIDATION_ERROR');
  }

  const sizeInBytes = (video.length * 3) / 4;
  const sizeInMB = sizeInBytes / (1024 * 1024);
  
  // Maximum file size is 100MB
  if (sizeInMB > 100) {
    throw new AppError(`Video too large (${sizeInMB.toFixed(1)}MB). Maximum supported size is 100MB.`, 400, 'VALIDATION_ERROR');
  }

  Logger.info(`Attempting to upload video for user ${userId}, size: ${sizeInMB.toFixed(2)}MB`);

  try {
    const result = await cloudinaryService.uploadVideo(video);

    // Store video reference in Image model (we can create a separate Video model later if needed)
    try {
      const videoRecord = new Image({
        userId,
        imageUrl: result.url, // Reusing imageUrl field for video URL
        publicId: result.publicId
      });
      await videoRecord.save();
      Logger.info(`Video record saved to database for user ${userId}, publicId: ${result.publicId}`);
    } catch (dbError) {
      Logger.error('Error saving video record to database', {
        userId,
        publicId: result.publicId,
        error: dbError.message,
        stack: dbError.stack
      });
      // Even if database save fails, the video is already uploaded to Cloudinary
      // We'll still return success but log the database error
      // In production, you might want to handle this differently (e.g., delete from Cloudinary)
    }

    Logger.info(`Video uploaded successfully for user ${userId}, publicId: ${result.publicId}`);

    res.status(200).json({
      success: true,
      message: 'Video uploaded successfully',
      data: {
        videoUrl: result.url,
        publicId: result.publicId
      }
    });
  } catch (error) {
    Logger.error('Error in uploadVideo controller', {
      userId,
      error: error.message,
      http_code: error.http_code,
      name: error.name,
      stack: error.stack
    });
    
    // Re-throw as AppError with appropriate status code
    if (error.message.includes('authentication') || error.message.includes('credentials') || error.message.includes('not properly configured')) {
      throw new AppError(error.message, 500, 'CLOUDINARY_CONFIG_ERROR');
    } else if (error.message.includes('timeout')) {
      throw new AppError(error.message, 408, 'UPLOAD_TIMEOUT');
    } else if (error.message.includes('too large') || error.http_code === 413) {
      throw new AppError(error.message, 413, 'FILE_TOO_LARGE');
    } else if (error.http_code === 400) {
      throw new AppError(error.message || 'Invalid video file', 400, 'VALIDATION_ERROR');
    } else {
      throw new AppError(error.message || 'Failed to upload video', 500, 'UPLOAD_ERROR');
    }
  }
});

/**
 * Delete video from Cloudinary
 * @route DELETE /api/upload/video
 * @access Private
 * @param {string} req.body.publicId - Cloudinary public ID
 * @returns {Object} Success message
 */
const deleteVideo = asyncHandler(async (req, res, next) => {
  const { publicId } = req.body;
  const userId = req.userId;

  if (!publicId) {
    throw new AppError('Public ID is required', 400, 'VALIDATION_ERROR');
  }

  const videoRecord = await Image.findOne({ publicId });

  if (!videoRecord) {
    throw new AppError('Video not found', 404, 'RESOURCE_NOT_FOUND');
  }

  if (videoRecord.userId.toString() !== userId.toString()) {
    throw new AppError('You do not have permission to delete this video', 403, 'FORBIDDEN');
  }

  await cloudinaryService.deleteVideo(publicId);
  await Image.deleteOne({ publicId });

  res.status(200).json({
    success: true,
    message: 'Video deleted successfully'
  });
});

/**
 * Upload PowerPoint file to Cloudinary
 * Supports both .ppt (Microsoft PowerPoint 97-2003) and .pptx (Office Open XML) formats
 * @route POST /api/upload/powerpoint
 * @access Private
 * @param {string} req.body.powerpoint - Base64 encoded PowerPoint file (.ppt or .pptx)
 * @returns {Object} Uploaded PowerPoint URL and public ID
 */
const uploadPowerPoint = asyncHandler(async (req, res, next) => {
  const { powerpoint } = req.body;
  const userId = req.userId;

  if (!powerpoint) {
    throw new AppError('PowerPoint file data is required', 400, 'VALIDATION_ERROR');
  }

  // Validate PowerPoint file format - accept files with any extension
  // FileReader.readAsDataURL may produce different MIME types depending on browser
  // .ppt files: application/vnd.ms-powerpoint (OLE2 compound document)
  // .pptx files: application/vnd.openxmlformats-officedocument.presentationml.presentation (ZIP archive)
  // Frontend validates file structure/signature, so backend accepts any valid data: URL
  const validMimeTypes = [
    'data:application/vnd.ms-powerpoint', // .ppt files (Microsoft PowerPoint 97-2003)
    'data:application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx files (Office Open XML)
    'data:application/mspowerpoint', // Alternative MIME type for .ppt
    'data:application/powerpoint', // Alternative MIME type
    'data:application/x-mspowerpoint', // Alternative MIME type for .ppt
    'data:application/octet-stream', // Some browsers report this for .ppt/.pptx
    'data:application/zip' // .pptx files are ZIP archives, some browsers report this
  ];
  
  // Check if the base64 string starts with a valid PowerPoint MIME type
  const isValidPowerPointMime = validMimeTypes.some(mimeType => 
    powerpoint.startsWith(mimeType)
  );
  
  // Accept any data: URL - frontend validation ensures correct file structure/signature
  // Frontend performs strict file signature validation (checks ZIP/OLE2 structure) before upload
  // This allows files with any extension as long as they have valid PowerPoint structure
  if (!isValidPowerPointMime && !powerpoint.startsWith('data:')) {
    throw new AppError('Invalid PowerPoint format. Must be a PowerPoint file created with Microsoft PowerPoint. File extension does not matter as long as the file structure is valid.', 400, 'VALIDATION_ERROR');
  }

  const sizeInBytes = (powerpoint.length * 3) / 4;
  const sizeInMB = sizeInBytes / (1024 * 1024);
  
  // Cloudinary has a 10MB limit for raw file uploads on standard plans
  // Note: upload_large may support larger files on upgraded plans, but we validate at 10MB for compatibility
  if (sizeInMB > 10) {
    throw new AppError(`PowerPoint file too large (${sizeInMB.toFixed(1)}MB). Maximum size is 10MB due to Cloudinary's raw file upload limit. Please compress your PowerPoint file.`, 400, 'VALIDATION_ERROR');
  }

  Logger.info(`Attempting to upload PowerPoint for user ${userId}, size: ${sizeInMB.toFixed(2)}MB`);

  try {
    const result = await cloudinaryService.uploadPowerPoint(powerpoint);

    // Store PowerPoint reference in Image model (we can create a separate Document model later if needed)
    try {
      const powerpointRecord = new Image({
        userId,
        imageUrl: result.url, // Reusing imageUrl field for PowerPoint URL
        publicId: result.publicId
      });
      await powerpointRecord.save();
      Logger.info(`PowerPoint record saved to database for user ${userId}, publicId: ${result.publicId}`);
    } catch (dbError) {
      Logger.error('Error saving PowerPoint record to database', {
        userId,
        publicId: result.publicId,
        error: dbError.message
      });
    }

    Logger.info(`PowerPoint uploaded successfully for user ${userId}, publicId: ${result.publicId}`);

    res.status(200).json({
      success: true,
      message: 'PowerPoint file uploaded successfully',
      data: {
        powerpointUrl: result.url,
        publicId: result.publicId
      }
    });
  } catch (error) {
    Logger.error('Error in uploadPowerPoint controller', {
      userId,
      error: error.message
    });
    
    throw new AppError(error.message || 'Failed to upload PowerPoint file', 500, 'UPLOAD_ERROR');
  }
});

/**
 * Upload PDF file to Cloudinary and convert pages to images
 * @route POST /api/upload/pdf
 * @access Private
 * @param {string} req.body.pdf - Base64 encoded PDF file
 * @returns {Object} Uploaded PDF URL, public ID, and page images
 */
const uploadPdf = asyncHandler(async (req, res, next) => {
  const { pdf } = req.body;
  const userId = req.userId;

  if (!pdf) {
    throw new AppError('PDF file data is required', 400, 'VALIDATION_ERROR');
  }

  // Check if it's a valid PDF file (base64 encoded)
  const isValidPdfMime = pdf.startsWith('data:application/pdf') || 
                          pdf.startsWith('data:application/octet-stream');
  
  if (!isValidPdfMime && !pdf.startsWith('data:')) {
    throw new AppError('Invalid PDF format. Must be a .pdf file.', 400, 'VALIDATION_ERROR');
  }

  const sizeInBytes = (pdf.length * 3) / 4;
  const sizeInMB = sizeInBytes / (1024 * 1024);
  
  // Allow up to 10MB for PDF files
  if (sizeInMB > 10) {
    throw new AppError(`PDF file too large (${sizeInMB.toFixed(1)}MB). Maximum size is 10MB.`, 400, 'VALIDATION_ERROR');
  }

  Logger.info(`Attempting to upload PDF for user ${userId}, size: ${sizeInMB.toFixed(2)}MB`);

  try {
    // Upload PDF to Cloudinary
    const result = await cloudinaryService.uploadPdf(pdf);

    // Store PDF reference in Image model
    try {
      const pdfRecord = new Image({
        userId,
        imageUrl: result.url, // Reusing imageUrl field for PDF URL
        publicId: result.publicId
      });
      await pdfRecord.save();
      Logger.info(`PDF record saved to database for user ${userId}, publicId: ${result.publicId}`);
    } catch (dbError) {
      Logger.error('Error saving PDF record to database', {
        userId,
        publicId: result.publicId,
        error: dbError.message
      });
    }

    Logger.info(`PDF uploaded successfully for user ${userId}, publicId: ${result.publicId}`);

    // Convert PDF pages to images using Cloudinary
    let pdfPages = [];
    try {
      Logger.info(`Starting PDF page conversion for user ${userId}`);
      pdfPages = await pdfConversionService.convertPdfPagesToImages(result.url, pdf, result.publicId);
      Logger.info(`PDF conversion completed: ${pdfPages.length} pages converted`);
    } catch (conversionError) {
      Logger.error('Error converting PDF pages', {
        userId,
        publicId: result.publicId,
        error: conversionError.message
      });
      // Still return success with PDF URL, but without page images
      // Frontend can handle this case
    }

    res.status(200).json({
      success: true,
      message: 'PDF file uploaded successfully',
      data: {
        pdfUrl: result.url,
        publicId: result.publicId,
        pdfPages: pdfPages
      }
    });
  } catch (error) {
    Logger.error('Error in uploadPdf controller', {
      userId,
      error: error.message
    });
    
    throw new AppError(error.message || 'Failed to upload PDF file', 500, 'UPLOAD_ERROR');
  }
});

module.exports = {
  uploadImage,
  deleteImage,
  getUserImages,
  uploadVideo,
  deleteVideo,
  uploadPowerPoint,
  uploadPdf
};
