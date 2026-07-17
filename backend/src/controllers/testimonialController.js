const Testimonial = require('../models/Testimonial');
const { validationResult } = require('express-validator');

// Helper to check if user is super admin
const isSuperAdmin = (req) => {
  return req.superAdmin && req.superAdmin.superAdmin === true;
};

/**
 * Submit a new testimonial
 */
exports.submitTestimonial = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
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
        return res.status(400).json({
          success: false,
          message: 'You have already submitted a testimonial. You can update your existing one.'
        });
      }
    }

    // Check for duplicate email submissions (spam prevention)
    const recentSubmission = await Testimonial.findOne({
      email,
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
    });

    if (recentSubmission) {
      return res.status(429).json({
        success: false,
        message: 'You have already submitted a testimonial recently. Please wait before submitting again.'
      });
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

    res.status(201).json({
      success: true,
      message: 'Testimonial submitted successfully. It will be reviewed before being published.',
      data: {
        testimonial: {
          _id: newTestimonial._id,
          status: newTestimonial.status
        }
      }
    });
  } catch (error) {
    console.error('Error submitting testimonial:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit testimonial',
      error: error.message
    });
  }
};

/**
 * Get user's own testimonials (private)
 */
exports.getMyTestimonials = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const userId = req.user._id;

    const query = { userId };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    const [testimonials, total] = await Promise.all([
      Testimonial.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Testimonial.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        testimonials,
        pagination: {
          page: parseInt(page),
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching my testimonials:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch your testimonials',
      error: error.message
    });
  }
};

/**
 * Get approved testimonials (public)
 */
exports.getTestimonials = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      rating,
      role,
      institution,
      featured,
      sort = 'newest'
    } = req.query;

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

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    const [testimonials, total] = await Promise.all([
      Testimonial.find(query)
        .select('-email -ipAddress -moderationNotes -approvedBy')
        .sort(sortOption)
        .skip(skip)
        .limit(limitNum)
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

    res.json({
      success: true,
      data: {
        testimonials,
        pagination: {
          page: parseInt(page),
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        },
        stats: {
          averageRating: Math.round(avgRating * 10) / 10,
          totalCount
        }
      }
    });
  } catch (error) {
    console.error('Error fetching testimonials:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch testimonials',
      error: error.message
    });
  }
};

/**
 * Get all testimonials (admin only)
 */
exports.getAllTestimonials = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      status,
      search
    } = req.query;

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

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    const [testimonials, total] = await Promise.all([
      Testimonial.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Testimonial.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        testimonials,
        pagination: {
          page: parseInt(page),
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching all testimonials:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch testimonials',
      error: error.message
    });
  }
};

/**
 * Get single testimonial by ID
 */
exports.getTestimonialById = async (req, res) => {
  try {
    const { id } = req.params;

    const testimonial = await Testimonial.findById(id);

    if (!testimonial) {
      return res.status(404).json({
        success: false,
        message: 'Testimonial not found'
      });
    }

    // Hide sensitive data for non-admin users
    if (!isSuperAdmin(req)) {
      const testimonialObj = testimonial.toObject();
      delete testimonialObj.email;
      delete testimonialObj.ipAddress;
      delete testimonialObj.moderationNotes;
      return res.json({
        success: true,
        data: { testimonial: testimonialObj }
      });
    }

    res.json({
      success: true,
      data: { testimonial }
    });
  } catch (error) {
    console.error('Error fetching testimonial:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch testimonial',
      error: error.message
    });
  }
};

/**
 * Approve testimonial (admin only)
 */
exports.approveTestimonial = async (req, res) => {
  try {
    const { id } = req.params;
    const { isFeatured } = req.body;

    const testimonial = await Testimonial.findById(id);

    if (!testimonial) {
      return res.status(404).json({
        success: false,
        message: 'Testimonial not found'
      });
    }

    testimonial.status = 'approved';
    testimonial.approvedAt = new Date();
    testimonial.approvedBy = req.superAdmin?.email || req.superAdmin?.id || 'admin';
    if (isFeatured !== undefined) {
      testimonial.isFeatured = isFeatured;
    }

    await testimonial.save();

    res.json({
      success: true,
      message: 'Testimonial approved successfully',
      data: { testimonial }
    });
  } catch (error) {
    console.error('Error approving testimonial:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve testimonial',
      error: error.message
    });
  }
};

/**
 * Reject testimonial (admin only)
 */
exports.rejectTestimonial = async (req, res) => {
  try {
    const { id } = req.params;
    const { moderationNotes } = req.body;

    const testimonial = await Testimonial.findById(id);

    if (!testimonial) {
      return res.status(404).json({
        success: false,
        message: 'Testimonial not found'
      });
    }

    testimonial.status = 'rejected';
    if (moderationNotes) {
      testimonial.moderationNotes = moderationNotes;
    }

    await testimonial.save();

    res.json({
      success: true,
      message: 'Testimonial rejected successfully',
      data: { testimonial }
    });
  } catch (error) {
    console.error('Error rejecting testimonial:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject testimonial',
      error: error.message
    });
  }
};

/**
 * Update testimonial (admin only)
 */
exports.updateTestimonial = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, rating, testimonial, role, institution, isFeatured } = req.body;

    const testimonialDoc = await Testimonial.findById(id);

    if (!testimonialDoc) {
      return res.status(404).json({
        success: false,
        message: 'Testimonial not found'
      });
    }

    if (name) testimonialDoc.name = name;
    if (rating) testimonialDoc.rating = rating;
    if (testimonial) testimonialDoc.testimonial = testimonial;
    if (role !== undefined) testimonialDoc.role = role;
    if (institution !== undefined) testimonialDoc.institution = institution;
    if (isFeatured !== undefined) testimonialDoc.isFeatured = isFeatured;

    await testimonialDoc.save();

    res.json({
      success: true,
      message: 'Testimonial updated successfully',
      data: { testimonial: testimonialDoc }
    });
  } catch (error) {
    console.error('Error updating testimonial:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update testimonial',
      error: error.message
    });
  }
};

/**
 * Delete testimonial (admin only)
 */
exports.deleteTestimonial = async (req, res) => {
  try {
    const { id } = req.params;

    const testimonial = await Testimonial.findByIdAndDelete(id);

    if (!testimonial) {
      return res.status(404).json({
        success: false,
        message: 'Testimonial not found'
      });
    }

    res.json({
      success: true,
      message: 'Testimonial deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting testimonial:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete testimonial',
      error: error.message
    });
  }
};

/**
 * Get testimonial statistics (admin only)
 */
exports.getTestimonialStats = async (req, res) => {
  try {
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

    res.json({
      success: true,
      data: {
        total,
        pending,
        approved,
        rejected,
        averageRating: avgRating[0]?.avgRating || 0,
        ratingDistribution: ratingDistribution.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {})
      }
    });
  } catch (error) {
    console.error('Error fetching testimonial stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch testimonial statistics',
      error: error.message
    });
  }
};

