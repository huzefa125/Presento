const Testimonial = require('../models/Testimonial');
const { validationResult } = require('express-validator');
const {
  asyncHandler,
  ok,
  created,
  paginated,
  message,
  notFound,
  badRequest,
  tooManyRequests,
  parsePagination,
  buildPagination
} = require('../utils');

// Helper to check if user is super admin
const isSuperAdmin = (req) => {
  return req.superAdmin && req.superAdmin.superAdmin === true;
};

/**
 * Submit a new testimonial
 */
exports.submitTestimonial = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // express-validator's per-field errors don't fit the standard envelope,
    // so this one path stays a plain response rather than throwing AppError.
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { name, email, rating, testimonial, role, institution, avatar } = req.body;

  // Get user ID from authenticated user
  const userId = req.user._id;

  // Get IP address for spam prevention
  const ipAddress = req.ip || req.connection.remoteAddress;

  // Check if user has already submitted a testimonial
  if (userId) {
    const existingTestimonial = await Testimonial.findOne({ userId });
    // Allow updating if rejected, otherwise block new submissions
    if (existingTestimonial && existingTestimonial.status !== 'rejected') {
      throw badRequest('You have already submitted a testimonial. You can update your existing one.');
    }
  }

  // Check for duplicate email submissions (spam prevention)
  const recentSubmission = await Testimonial.findOne({
    email,
    createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
  });

  if (recentSubmission) {
    throw tooManyRequests('You have already submitted a testimonial recently. Please wait before submitting again.');
  }

  const newTestimonial = new Testimonial({
    name,
    email,
    rating,
    testimonial,
    role: role || null,
    institution: institution || null,
    avatar: avatar || null,
    userId,
    ipAddress,
    status: 'pending'
  });

  await newTestimonial.save();

  created(res, {
    testimonial: {
      _id: newTestimonial._id,
      status: newTestimonial.status
    }
  }, 'Testimonial submitted successfully. It will be reviewed before being published.');
});

/**
 * Get user's own testimonials (private)
 */
exports.getMyTestimonials = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const userId = req.user._id;

  const query = { userId };

  const [testimonials, total] = await Promise.all([
    Testimonial.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Testimonial.countDocuments(query)
  ]);

  paginated(res, 'testimonials', testimonials, buildPagination(page, limit, total));
});

/**
 * Get approved testimonials (public)
 */
exports.getTestimonials = asyncHandler(async (req, res) => {
  const { rating, role, institution, featured, sort = 'newest' } = req.query;
  const { page, limit, skip } = parsePagination(req.query);

  const query = { status: 'approved' };

  // Filter by institution
  if (institution) {
    query.institution = new RegExp(institution, 'i');
  }

  // Filter by rating
  if (rating) {
    query.rating = parseInt(rating);
  }

  // Filter by role
  if (role) {
    query.role = new RegExp(role, 'i');
  }

  // Filter featured
  if (featured === 'true') {
    query.isFeatured = true;
  }

  // Sort options
  let sortOption = {};
  switch (sort) {
    case 'newest':
      sortOption = { createdAt: -1 };
      break;
    case 'oldest':
      sortOption = { createdAt: 1 };
      break;
    case 'highest':
      sortOption = { rating: -1, createdAt: -1 };
      break;
    case 'lowest':
      sortOption = { rating: 1, createdAt: -1 };
      break;
    default:
      sortOption = { isFeatured: -1, createdAt: -1 };
  }

  // Always prioritize featured testimonials when not sorting by rating
  if (sort !== 'highest' && sort !== 'lowest') {
    sortOption = { isFeatured: -1, ...sortOption };
  }

  const [testimonials, total] = await Promise.all([
    Testimonial.find(query)
      .select('-email -ipAddress -moderationNotes -approvedBy')
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .lean(),
    Testimonial.countDocuments(query)
  ]);

  // Calculate average rating
  const avgRatingResult = await Testimonial.aggregate([
    { $match: { status: 'approved' } },
    { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } }
  ]);

  const avgRating = avgRatingResult[0]?.avgRating || 0;
  const totalCount = avgRatingResult[0]?.count || 0;

  // Set cache-control headers to prevent caching
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });

  paginated(res, 'testimonials', testimonials, buildPagination(page, limit, total), {
    stats: {
      averageRating: Math.round(avgRating * 10) / 10,
      totalCount
    }
  });
});

/**
 * Get all testimonials (admin only)
 */
exports.getAllTestimonials = asyncHandler(async (req, res) => {
  const { status, search } = req.query;
  const { page, limit, skip } = parsePagination(req.query, { defaultLimit: 50 });

  const query = {};

  // Filter by status
  if (status && ['pending', 'approved', 'rejected'].includes(status)) {
    query.status = status;
  }

  // Search by name, email, or testimonial text
  if (search) {
    query.$or = [
      { name: new RegExp(search, 'i') },
      { email: new RegExp(search, 'i') },
      { testimonial: new RegExp(search, 'i') }
    ];
  }

  const [testimonials, total] = await Promise.all([
    Testimonial.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Testimonial.countDocuments(query)
  ]);

  paginated(res, 'testimonials', testimonials, buildPagination(page, limit, total));
});

/**
 * Get single testimonial by ID
 */
exports.getTestimonialById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const testimonial = await Testimonial.findById(id);

  if (!testimonial) {
    throw notFound('Testimonial');
  }

  // Hide sensitive data for non-admin users
  if (!isSuperAdmin(req)) {
    const testimonialObj = testimonial.toObject();
    delete testimonialObj.email;
    delete testimonialObj.ipAddress;
    delete testimonialObj.moderationNotes;
    return ok(res, { testimonial: testimonialObj });
  }

  ok(res, { testimonial });
});

/**
 * Approve testimonial (admin only)
 */
exports.approveTestimonial = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { isFeatured } = req.body;

  const testimonial = await Testimonial.findById(id);

  if (!testimonial) {
    throw notFound('Testimonial');
  }

  testimonial.status = 'approved';
  testimonial.approvedAt = new Date();
  testimonial.approvedBy = req.superAdmin?.email || req.superAdmin?.id || 'admin';
  if (isFeatured !== undefined) {
    testimonial.isFeatured = isFeatured;
  }

  await testimonial.save();

  ok(res, { testimonial }, 'Testimonial approved successfully');
});

/**
 * Reject testimonial (admin only)
 */
exports.rejectTestimonial = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { moderationNotes } = req.body;

  const testimonial = await Testimonial.findById(id);

  if (!testimonial) {
    throw notFound('Testimonial');
  }

  testimonial.status = 'rejected';
  if (moderationNotes) {
    testimonial.moderationNotes = moderationNotes;
  }

  await testimonial.save();

  ok(res, { testimonial }, 'Testimonial rejected successfully');
});

/**
 * Update testimonial (admin only)
 */
exports.updateTestimonial = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, rating, testimonial, role, institution, isFeatured } = req.body;

  const testimonialDoc = await Testimonial.findById(id);

  if (!testimonialDoc) {
    throw notFound('Testimonial');
  }

  if (name) testimonialDoc.name = name;
  if (rating) testimonialDoc.rating = rating;
  if (testimonial) testimonialDoc.testimonial = testimonial;
  if (role !== undefined) testimonialDoc.role = role;
  if (institution !== undefined) testimonialDoc.institution = institution;
  if (isFeatured !== undefined) testimonialDoc.isFeatured = isFeatured;

  await testimonialDoc.save();

  ok(res, { testimonial: testimonialDoc }, 'Testimonial updated successfully');
});

/**
 * Delete testimonial (admin only)
 */
exports.deleteTestimonial = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const testimonial = await Testimonial.findByIdAndDelete(id);

  if (!testimonial) {
    throw notFound('Testimonial');
  }

  message(res, 'Testimonial deleted successfully');
});

/**
 * Get testimonial statistics (admin only)
 */
exports.getTestimonialStats = asyncHandler(async (req, res) => {
  const [total, pending, approved, rejected, avgRating, ratingDistribution] = await Promise.all([
    Testimonial.countDocuments(),
    Testimonial.countDocuments({ status: 'pending' }),
    Testimonial.countDocuments({ status: 'approved' }),
    Testimonial.countDocuments({ status: 'rejected' }),
    Testimonial.aggregate([
      { $match: { status: 'approved' } },
      { $group: { _id: null, avgRating: { $avg: '$rating' } } }
    ]),
    Testimonial.aggregate([
      { $match: { status: 'approved' } },
      { $group: { _id: '$rating', count: { $sum: 1 } } },
      { $sort: { _id: -1 } }
    ])
  ]);

  ok(res, {
    total,
    pending,
    approved,
    rejected,
    averageRating: avgRating[0]?.avgRating || 0,
    ratingDistribution: ratingDistribution.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {})
  });
});
