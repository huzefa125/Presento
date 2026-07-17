const JobApplication = require('../models/JobApplication');
const cloudinaryService = require('../services/cloudinaryService');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const Logger = require('../utils/logger');

/**
 * Submit job application
 * @route POST /api/careers/apply
 * @access Public
 */
const submitApplication = asyncHandler(async (req, res, next) => {
  const {
      firstName,
      lastName,
      email,
      phone,
      location,
      linkedinUrl,
      portfolioUrl,
      githubUrl,
      position,
      department,
      expectedSalary,
      availability,
      experience,
      education,
      skills,
      coverLetter,
      whyInavora,
      additionalInfo,
      resume
  } = req.body;

  if (!firstName || !lastName || !email || !phone || !location || !position || !department || !coverLetter || !resume) {
    throw new AppError('Please fill in all required fields', 400, 'VALIDATION_ERROR');
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new AppError('Please provide a valid email address', 400, 'VALIDATION_ERROR');
  }

  let resumeUrl = resume.url;
  let resumePublicId = resume.publicId || '';
  let resumeFileName = resume.fileName || 'resume.pdf';
  let resumeFileSize = resume.fileSize || 0;

  if (resume.base64) {
    const sizeInBytes = (resume.base64.length * 3) / 4;
    const sizeInMB = sizeInBytes / (1024 * 1024);
    
    if (sizeInMB > 5) {
      throw new AppError(`Resume file is too large (${sizeInMB.toFixed(1)}MB). Maximum size is 5MB.`, 400, 'VALIDATION_ERROR');
    }

    const uploadResult = await cloudinaryService.uploadDocument(resume.base64, `resumes/${email}_${Date.now()}`);
    resumeUrl = uploadResult.url;
    resumePublicId = uploadResult.publicId;
    resumeFileName = resume.fileName || 'resume.pdf';
    resumeFileSize = sizeInBytes;
  }

  const ipAddress = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'];
  const userAgent = req.headers['user-agent'];

  const application = new JobApplication({
      firstName,
      lastName,
      email,
      phone,
      location,
      linkedinUrl: linkedinUrl || '',
      portfolioUrl: portfolioUrl || '',
      githubUrl: githubUrl || '',
      position,
      department,
      expectedSalary: expectedSalary || '',
      availability: availability || '1 month',
      experience: experience || [],
      education: education || [],
      skills: skills || { technical: [], soft: [] },
      coverLetter,
      whyInavora: whyInavora || '',
      additionalInfo: additionalInfo || '',
      resume: {
        url: resumeUrl,
        publicId: resumePublicId,
        fileName: resumeFileName,
        fileSize: resumeFileSize
      },
    ipAddress,
    userAgent
  });

  await application.save();

  const JobPosting = require('../models/JobPosting');
  await JobPosting.updateOne(
    { title: position, status: 'active' },
    { $inc: { applicationCount: 1 } }
  );

  const io = req.app.get('io');
  if (io) {
    io.emit('new-application', {
      applicationId: application._id,
      candidateName: `${firstName} ${lastName}`,
      email,
      position,
      department,
      status: 'pending',
      createdAt: application.createdAt
    });
  }

  res.status(201).json({
    success: true,
    message: 'Application submitted successfully! We will review it and get back to you soon.',
    data: {
      applicationId: application._id
    }
  });
});

/**
 * Get all applications (Admin only)
 * @route GET /api/careers/applications
 * @access Private (Admin)
 */
const getApplications = asyncHandler(async (req, res, next) => {
  const { status, position, page = 1, limit = 10 } = req.query;
  
  const query = {};
  if (status) query.status = status;
  if (position) query.position = { $regex: position, $options: 'i' };

  const applications = await JobApplication.find(query)
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .select('-resume.publicId -ipAddress -userAgent')
    .lean();

  const total = await JobApplication.countDocuments(query);

  res.status(200).json({
    success: true,
    data: {
      applications,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    }
  });
});

/**
 * Get single application by ID
 * @route GET /api/careers/applications/:id
 * @access Private (Admin)
 */
const getApplication = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const application = await JobApplication.findById(id).lean();

  if (!application) {
    throw new AppError('Application not found', 404, 'RESOURCE_NOT_FOUND');
  }

  res.status(200).json({
    success: true,
    data: application
  });
});

/**
 * Update application status (Admin only)
 * @route PUT /api/careers/applications/:id/status
 * @access Private (Admin)
 */
const updateApplicationStatus = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status || !['pending', 'reviewing', 'shortlisted', 'interview', 'rejected', 'accepted'].includes(status)) {
    throw new AppError('Invalid status', 400, 'VALIDATION_ERROR');
  }

  const application = await JobApplication.findByIdAndUpdate(
    id,
    { status },
    { new: true }
  );

  if (!application) {
    throw new AppError('Application not found', 404, 'RESOURCE_NOT_FOUND');
  }

  res.status(200).json({
    success: true,
    message: 'Application status updated successfully',
    data: application
  });
});

module.exports = {
  submitApplication,
  getApplications,
  getApplication,
  updateApplicationStatus
};

