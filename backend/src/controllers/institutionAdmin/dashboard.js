/**
 * Institution Admin - dashboard
 * Split out of the former institutionAdminController.js monolith; see ../../../../CODE_STANDARDS.md
 */
const { AppError, asyncHandler } = require('../../middleware/errorHandler');
const Institution = require('../../models/Institution');
const User = require('../../models/User');
const Presentation = require('../../models/Presentation');
const Slide = require('../../models/Slide');
const Response = require('../../models/Response');

/**
 * Get Dashboard Statistics
 * @route GET /api/institution-admin/dashboard/stats
 * @access Private (Institution Admin)
 */
const getDashboardStats = asyncHandler(async (req, res, next) => {
  const institutionId = req.institutionId;

  const totalUsers = await User.countDocuments({ 
    institutionId,
    isInstitutionUser: true 
  });

  const institutionUsers = await User.find({ 
    institutionId,
    isInstitutionUser: true 
  }).select('_id').lean();

  const userIds = institutionUsers.map(user => user._id);

  const totalPresentations = await Presentation.countDocuments({ 
    userId: { $in: userIds } 
  });

  const livePresentations = await Presentation.countDocuments({ 
    userId: { $in: userIds },
    isLive: true 
  });

  const presentations = await Presentation.find({ 
    userId: { $in: userIds } 
  }).select('_id').lean();

  const presentationIds = presentations.map(p => p._id);
  const totalSlides = await Slide.countDocuments({ 
    presentationId: { $in: presentationIds } 
  });

  const totalResponses = await Response.countDocuments({ 
    presentationId: { $in: presentationIds } 
  });

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const activeUsers = await Presentation.distinct('userId', {
    userId: { $in: userIds },
    createdAt: { $gte: thirtyDaysAgo }
  });

  const recentPresentations = await Presentation.countDocuments({
    userId: { $in: userIds },
    createdAt: { $gte: thirtyDaysAgo }
  });

  const recentResponses = await Response.countDocuments({
    presentationId: { $in: presentationIds },
    submittedAt: { $gte: thirtyDaysAgo }
  });

  res.status(200).json({
    success: true,
    data: {
      totalUsers,
      totalPresentations,
      livePresentations,
      totalSlides,
      totalResponses,
      activeUsers: activeUsers.length,
      recentPresentations,
      recentResponses
    }
  });
});

/**
 * Get Analytics Data
 * @route GET /api/institution-admin/analytics
 * @access Private (Institution Admin)
 */
const getAnalytics = asyncHandler(async (req, res, next) => {
  const institutionId = req.institutionId;
  const { period = '30' } = req.query;

  const days = parseInt(period);
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const institutionUsers = await User.find({ 
    institutionId,
    isInstitutionUser: true 
  }).select('_id').lean();

  const userIds = institutionUsers.map(user => user._id);

  const presentations = await Presentation.find({
    userId: { $in: userIds },
    createdAt: { $gte: startDate }
  }).select('_id createdAt').lean();

  const presentationIds = presentations.map(p => p._id);

  const responses = await Response.find({
    presentationId: { $in: presentationIds },
    submittedAt: { $gte: startDate }
  }).select('submittedAt').lean();

  const presentationStats = {};
  const responseStats = {};

  presentations.forEach(presentation => {
    const date = presentation.createdAt.toISOString().split('T')[0];
    presentationStats[date] = (presentationStats[date] || 0) + 1;
  });

  responses.forEach(response => {
    if (response.submittedAt) {
      const date = response.submittedAt.toISOString().split('T')[0];
      responseStats[date] = (responseStats[date] || 0) + 1;
    }
  });

  const topPresentations = await Response.aggregate([
    {
      $match: {
        presentationId: { $in: presentationIds },
        submittedAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$presentationId',
        responseCount: { $sum: 1 }
      }
    },
    {
      $sort: { responseCount: -1 }
    },
    {
      $limit: 10
    }
  ]);

  const topPresentationIds = topPresentations.map(tp => tp._id);
  const topPresentationDetails = await Presentation.find({
    _id: { $in: topPresentationIds }
  }).select('title accessCode').lean();

  const topPresentationsWithDetails = topPresentations.map(tp => {
    const details = topPresentationDetails.find(p => p._id.toString() === tp._id.toString());
    return {
      presentationId: tp._id,
      title: details?.title || 'Unknown',
      accessCode: details?.accessCode || 'N/A',
      responseCount: tp.responseCount
    };
  });

  res.status(200).json({
    success: true,
    data: {
      period: days,
      presentationStats,
      responseStats,
      topPresentations: topPresentationsWithDetails,
      totalPresentations: presentations.length,
      totalResponses: responses.length
    }
  });
});

/**
 * Get Usage Statistics
 * @route GET /api/institution-admin/subscription/usage
 * @access Private (Institution Admin)
 */
const getUsageStatistics = asyncHandler(async (req, res, next) => {
  const institutionId = req.institutionId;
  const institution = await Institution.findById(institutionId).select('subscription');
  
  if (!institution) {
    throw new AppError('Institution not found', 404, 'RESOURCE_NOT_FOUND');
  }

  const User = require('../models/User');
  const Presentation = require('../models/Presentation');
  
  // Get user count
  const totalUsers = await User.countDocuments({ 
    institutionId, 
    isInstitutionUser: true 
  });

  // Get active users (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const activeUsers = await User.countDocuments({
    institutionId,
    isInstitutionUser: true,
    lastLogin: { $gte: thirtyDaysAgo }
  });

  // Get presentations count
  const institutionUsers = await User.find({ 
    institutionId, 
    isInstitutionUser: true 
  }).select('_id').lean();
  const userIds = institutionUsers.map(u => u._id);
  
  const totalPresentations = await Presentation.countDocuments({
    userId: { $in: userIds }
  });

  // Get total responses
  const totalResponses = await Presentation.aggregate([
    { $match: { userId: { $in: userIds } } },
    { $group: { _id: null, total: { $sum: { $ifNull: ['$responseCount', 0] } } } }
  ]);

  const subscription = institution.subscription || {};
  const maxUsers = subscription.maxUsers || 10;
  const userUsagePercent = maxUsers ? ((totalUsers / maxUsers) * 100) : 0;

  res.status(200).json({
    success: true,
    usage: {
      totalUsers: totalUsers,
      activeUsers: activeUsers || 0,
      maxUsers: maxUsers,
      userUsagePercent: Math.min(100, userUsagePercent),
      totalPresentations: totalPresentations,
      totalResponses: totalResponses[0]?.total || 0,
      lastUpdated: new Date()
    }
  });
});

module.exports = {
  getDashboardStats,
  getAnalytics,
  getUsageStatistics
};
