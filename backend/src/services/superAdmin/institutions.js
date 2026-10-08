/**
 * Super Admin Service - institutions
 * Split out of the former superAdminService.js monolith; see ../../../CODE_STANDARDS.md
 */
const User = require('../../models/User');
const Institution = require('../../models/Institution');
const Payment = require('../../models/Payment');
const Logger = require('../../utils/logger');
const { getEffectivePlan } = require('../institutionPlanService');

/**
 * Get institutions list with filters and pagination
 */
const getInstitutions = async (filters = {}, page = 1, limit = 50) => {
  try {
    const query = {};

    // Search filter
    if (filters.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: 'i' } },
        { email: { $regex: filters.search, $options: 'i' } },
        { adminEmail: { $regex: filters.search, $options: 'i' } }
      ];
    }

    // Status filter
    if (filters.status) {
      query['subscription.status'] = filters.status;
    }

    // Date range filter
    if (filters.dateFrom || filters.dateTo) {
      query.createdAt = {};
      if (filters.dateFrom) {
        query.createdAt.$gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        query.createdAt.$lte = new Date(filters.dateTo);
      }
    }

    const skip = (page - 1) * limit;

    const [institutions, total] = await Promise.all([
      Institution.find(query)
        .select('-password -__v')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Institution.countDocuments(query)
    ]);

    // Get user counts for each institution
    const institutionsWithUserCounts = await Promise.all(
      institutions.map(async (institution) => {
        const userCount = await User.countDocuments({
          institutionId: institution._id
        });
        return {
          ...institution,
          actualUserCount: userCount
        };
      })
    );

    return {
      institutions: institutionsWithUserCounts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    Logger.error('Error getting institutions:', error);
    throw error;
  }
};

/**
 * Get institution details by ID
 */
const getInstitutionById = async (institutionId) => {
  try {
    const institution = await Institution.findById(institutionId)
      .select('-password -__v')
      .lean();

    if (!institution) {
      throw new Error('Institution not found');
    }

    // Get institution users with effective plans
    const usersRaw = await User.find({ institutionId: institutionId })
      .select('email displayName subscription createdAt isInstitutionUser')
      .sort({ createdAt: -1 })
      .lean();

    const users = await Promise.all(
      usersRaw.map(async (user) => {
        let subscription = user.subscription;
        if (user.isInstitutionUser && user.institutionId) {
          try {
            const userDoc = await User.findById(user._id);
            if (userDoc) {
              const effectivePlan = await getEffectivePlan(userDoc);
              subscription = {
                ...user.subscription,
                plan: effectivePlan.plan,
                status: effectivePlan.status,
                endDate: effectivePlan.endDate
              };
            }
          } catch (error) {
            Logger.error(`Error getting effective plan for user ${user._id}`, error);
          }
        }
        return {
          ...user,
          subscription
        };
      })
    );

    // Get institution payments
    const payments = await Payment.find({ institutionId: institutionId })
      .select('amount plan status createdAt')
      .sort({ createdAt: -1 })
      .lean();

    return {
      institution,
      users,
      payments
    };
  } catch (error) {
    Logger.error('Error getting institution by ID:', error);
    throw error;
  }
};

module.exports = {
  getInstitutions,
  getInstitutionById
};
