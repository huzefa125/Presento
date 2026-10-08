/**
 * Institution Admin - presentations
 * Split out of the former institutionAdminController.js monolith; see ../../../../CODE_STANDARDS.md
 */
const { asyncHandler } = require('../../middleware/errorHandler');
const mongoose = require('mongoose');
const User = require('../../models/User');
const Presentation = require('../../models/Presentation');
const Slide = require('../../models/Slide');
const Response = require('../../models/Response');

/**
 * Get All Presentations by Institution Users
 * @route GET /api/institution-admin/presentations
 * @access Private (Institution Admin)
 */
const getInstitutionPresentations = asyncHandler(async (req, res, next) => {
  const institutionId = req.institutionId;
  const { page = 1, limit = 20, search = '', status = 'all', userId } = req.query;

  // Get all users that are properly linked to this institution
  // Must have both institutionId matching AND isInstitutionUser flag set
  const institutionUsers = await User.find({ 
    institutionId: mongoose.Types.ObjectId.isValid(institutionId) ? new mongoose.Types.ObjectId(institutionId) : institutionId,
    isInstitutionUser: true 
  }).select('_id email displayName institutionId').lean();

  // Also get admin user account if it exists and verify it belongs to this institution
  const adminEmail = req.institutionAdmin?.email || req.institution?.adminEmail;
  let adminUser = null;
  if (adminEmail) {
    adminUser = await User.findOne({ 
      email: adminEmail.toLowerCase(),
      institutionId: mongoose.Types.ObjectId.isValid(institutionId) ? new mongoose.Types.ObjectId(institutionId) : institutionId
    }).select('_id email displayName institutionId isInstitutionUser').lean();
    
    // Only add admin user if it actually belongs to this institution
    // Must have matching institutionId (already filtered in query above)
    if (adminUser && adminUser.institutionId && adminUser.institutionId.toString() === institutionId.toString()) {
      const adminInList = institutionUsers.find(u => u._id.toString() === adminUser._id.toString());
      if (!adminInList) {
        institutionUsers.push({
          _id: adminUser._id,
          email: adminUser.email,
          displayName: adminUser.displayName,
          institutionId: adminUser.institutionId
        });
      }
    }
  }

  // Only include userIds from users that are confirmed to belong to this institution
  const userIds = institutionUsers
    .filter(user => user.institutionId && user.institutionId.toString() === institutionId.toString())
    .map(user => user._id);
  
  const userMap = new Map(institutionUsers
    .filter(user => user.institutionId && user.institutionId.toString() === institutionId.toString())
    .map(user => [user._id.toString(), user]));

  // If userId is provided, filter by that specific user (for "My Presentations")
  // Otherwise, show all institution users' presentations
  let query;
  if (userId) {
    // Verify the userId belongs to this institution
    // Only allow if the user is in the verified institutionUsers list with matching institutionId
    const targetUser = institutionUsers.find(u => 
      u._id.toString() === userId.toString() && 
      u.institutionId && 
      u.institutionId.toString() === institutionId.toString()
    );
    
    if (!targetUser) {
      // User not found or doesn't belong to this institution, return empty result
      return res.status(200).json({
        success: true,
        data: {
          presentations: [],
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: 0,
            pages: 0
          }
        }
      });
    }
    // Convert userId string to ObjectId for MongoDB query
    query = { userId: mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : userId };
  } else {
    // Only query presentations from users that are confirmed to belong to this institution
    if (userIds.length === 0) {
      // No valid institution users, return empty result
      return res.status(200).json({
        success: true,
        data: {
          presentations: [],
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: 0,
            pages: 0
          }
        }
      });
    }
    query = { userId: { $in: userIds } };
  }

  if (search) {
    query.title = { $regex: search, $options: 'i' };
  }

  if (status === 'live') {
    query.isLive = true;
  } else if (status === 'ended') {
    query.isLive = false;
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const presentations = await Presentation.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

  const total = await Presentation.countDocuments(query);

  const presentationIds = presentations.map(p => p._id);
  const slideCounts = await Slide.aggregate([
    { $match: { presentationId: { $in: presentationIds } } },
    { $group: { _id: '$presentationId', count: { $sum: 1 } } }
  ]);
  const slideCountMap = new Map(slideCounts.map(sc => [sc._id.toString(), sc.count]));

  const responseCounts = await Response.aggregate([
    { $match: { presentationId: { $in: presentationIds } } },
    { $group: { _id: '$presentationId', count: { $sum: 1 } } }
  ]);
  const responseCountMap = new Map(responseCounts.map(rc => [rc._id.toString(), rc.count]));

  const presentationsWithStats = presentations.map((presentation) => {
    const user = userMap.get(presentation.userId.toString());
    return {
      id: presentation._id,
      title: presentation.title,
      accessCode: presentation.accessCode,
      isLive: presentation.isLive,
      currentSlideIndex: presentation.currentSlideIndex,
      showResults: presentation.showResults,
      slideCount: slideCountMap.get(presentation._id.toString()) || 0,
      responseCount: responseCountMap.get(presentation._id.toString()) || 0,
      createdBy: {
        id: user?._id,
        email: user?.email,
        displayName: user?.displayName
      },
      createdAt: presentation.createdAt,
      updatedAt: presentation.updatedAt
    };
  });

  res.status(200).json({
    success: true,
    data: {
      presentations: presentationsWithStats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    }
  });
});

module.exports = {
  getInstitutionPresentations
};
