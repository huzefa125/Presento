const JobPosting = require('../models/JobPosting');
const JobApplication = require('../models/JobApplication');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const Logger = require('../utils/logger');

/**
 * Create a new job posting
 * @route POST /api/job-postings
 * @access Private (Admin)
 */
const createJobPosting = asyncHandler(async (req, res, next) => {
  const {
    title,
    department,
    location,
    type,
    description,
    requirements,
    responsibilities,
    benefits,
    salaryRange,
    experienceLevel,
    status,
    expiresAt
  } = req.body;

  if (!title || !department || !description) {
    throw new AppError('Title, department, and description are required', 400, 'VALIDATION_ERROR');
  }

    const jobPosting = new JobPosting({
      title,
      department,
      location: location || 'Remote / Chennai',
      type: type || 'Full-time',
      description,
      requirements: requirements || [],
      responsibilities: responsibilities || [],
      benefits: benefits || [],
      salaryRange: salaryRange || {},
      experienceLevel: experienceLevel || 'Mid Level',
      status: status || 'draft',
      postedBy: req.userId || 'admin',
      expiresAt: expiresAt ? new Date(expiresAt) : null
    });

  await jobPosting.save();

  const io = req.app.get('io');
  if (io) {
    io.emit('job-posting-created', jobPosting);
  }

  res.status(201).json({
    success: true,
    message: 'Job posting created successfully',
    data: jobPosting
  });
});

/**
 * Get all job postings
 * @route GET /api/job-postings
 * @access Private (Admin)
 */
const getJobPostings = asyncHandler(async (req, res, next) => {
  const { status, department, search, page = 1, limit = 10 } = req.query;
  
  const query = {};
  if (status) query.status = status;
  if (department) query.department = department;
  if (search) {
    query.$text = { $search: search };
  }

  const jobPostings = await JobPosting.find(query)
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .lean();

  const total = await JobPosting.countDocuments(query);

  res.status(200).json({
    success: true,
    data: {
      jobPostings,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    }
  });
});

/**
 * Get active job postings (for careers page)
 * @route GET /api/job-postings/active
 * @access Public
 */
const getActiveJobPostings = asyncHandler(async (req, res, next) => {
  const jobPostings = await JobPosting.find({
    status: 'active',
    $or: [
      { expiresAt: null },
      { expiresAt: { $gte: new Date() } }
    ]
  })
    .sort({ createdAt: -1 })
    .select('title department location type description responsibilities requirements createdAt')
    .lean();

  res.status(200).json({
    success: true,
    data: jobPostings
  });
});

/**
 * Get single job posting by ID
 * @route GET /api/job-postings/:id
 * @access Public
 */
const getJobPosting = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const jobPosting = await JobPosting.findById(id);

  if (!jobPosting) {
    throw new AppError('Job posting not found', 404, 'RESOURCE_NOT_FOUND');
  }

  jobPosting.views += 1;
  await jobPosting.save();

  res.status(200).json({
    success: true,
    data: jobPosting
  });
});

/**
 * Update job posting
 * @route PUT /api/job-postings/:id
 * @access Private (Admin)
 */
const updateJobPosting = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const updateData = req.body;

  const jobPosting = await JobPosting.findByIdAndUpdate(
    id,
    updateData,
    { new: true, runValidators: true }
  );

  if (!jobPosting) {
    throw new AppError('Job posting not found', 404, 'RESOURCE_NOT_FOUND');
  }

  const io = req.app.get('io');
  if (io) {
    io.emit('job-posting-updated', jobPosting);
  }

  res.status(200).json({
    success: true,
    message: 'Job posting updated successfully',
    data: jobPosting
  });
});

/**
 * Delete job posting
 * @route DELETE /api/job-postings/:id
 * @access Private (Admin)
 */
const deleteJobPosting = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const jobPosting = await JobPosting.findByIdAndDelete(id);

  if (!jobPosting) {
    throw new AppError('Job posting not found', 404, 'RESOURCE_NOT_FOUND');
  }

  const io = req.app.get('io');
  if (io) {
    io.emit('job-posting-deleted', { id });
  }

  res.status(200).json({
    success: true,
    message: 'Job posting deleted successfully'
  });
});

/**
 * Get dashboard statistics
 * @route GET /api/job-postings/dashboard/stats
 * @access Private (Admin)
 */
const getDashboardStats = asyncHandler(async (req, res, next) => {
  const totalJobs = await JobPosting.countDocuments();
  const activeJobs = await JobPosting.countDocuments({ status: 'active' });
  const totalApplications = await JobApplication.countDocuments();
  const pendingApplications = await JobApplication.countDocuments({ status: 'pending' });
  const recentApplications = await JobApplication.find()
    .sort({ createdAt: -1 })
    .limit(10)
    .select('firstName lastName email position status createdAt')
    .lean();

  const applicationsByStatus = await JobApplication.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  const applicationsByPosition = await JobApplication.aggregate([
    {
      $group: {
        _id: '$position',
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ]);

  res.status(200).json({
    success: true,
    data: {
      totalJobs,
      activeJobs,
      totalApplications,
      pendingApplications,
      recentApplications,
      applicationsByStatus,
      applicationsByPosition
    }
  });
});

module.exports = {
  createJobPosting,
  getJobPostings,
  getActiveJobPostings,
  getJobPosting,
  updateJobPosting,
  deleteJobPosting,
  getDashboardStats
};

