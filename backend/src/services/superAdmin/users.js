/**
 * Super Admin Service - users
 * Split out of the former superAdminService.js monolith; see ../../../CODE_STANDARDS.md
 */
const User = require('../../models/User');
const Payment = require('../../models/Payment');
const Presentation = require('../../models/Presentation');
const Logger = require('../../utils/logger');
const { getEffectivePlan } = require('../institutionPlanService');

/**
 * Get users list with filters and pagination
 */
const getUsers = async (filters = {}, page = 1, limit = 50) => {
  try {
    const query = {};

    // Search filter
    if (filters.search) {
      query.$or = [
        { email: { $regex: filters.search, $options: 'i' } },
        { displayName: { $regex: filters.search, $options: 'i' } }
      ];
    }

    // Plan filter - handle institution users correctly
    if (filters.plan) {
      if (filters.plan === 'institution') {
        // For institution plan, find users who are institution users
        query.isInstitutionUser = true;
        query.institutionId = { $exists: true, $ne: null };
      } else {
        // For other plans (free, pro, lifetime), exclude institution users
        // Institution users should only show up when filtering for 'institution'
        query.$and = [
          { 'subscription.plan': filters.plan },
          {
            $or: [
              { isInstitutionUser: { $ne: true } },
              { isInstitutionUser: { $exists: false } },
              { institutionId: { $exists: false } },
              { institutionId: null }
            ]
          }
        ];
      }
    }

    // Status filter
    if (filters.status) {
      if (filters.status === 'active') {
        query['subscription.status'] = 'active';
      } else if (filters.status === 'expired') {
        query['subscription.status'] = 'expired';
      } else if (filters.status === 'institution') {
        query.isInstitutionUser = true;
      }
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

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-__v')
        .populate('institutionId', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(query)
    ]);

    // Get effective plans for institution users
    const usersWithEffectivePlans = await Promise.all(
      users.map(async (user) => {
        let subscription = user.subscription;
        if (user.isInstitutionUser && user.institutionId) {
          try {
            // Convert lean object back to Mongoose document for getEffectivePlan
            const userDoc = await User.findById(user._id);
            if (userDoc) {
              const effectivePlan = await getEffectivePlan(userDoc);
              
              // Debug logging for specific user
              if (user.email === 'vikashdotdev@gmail.com') {
                Logger.info(`[DEBUG] User ${user.email} plan check:`, {
                  isInstitutionUser: user.isInstitutionUser,
                  institutionId: user.institutionId,
                  originalSubscriptionPlan: user.subscription?.plan,
                  effectivePlanResult: effectivePlan,
                  subscriptionAfterUpdate: {
                    ...user.subscription,
                    plan: effectivePlan.plan,
                    status: effectivePlan.status,
                    endDate: effectivePlan.endDate
                  }
                });
              }
              
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
        } else if (user.email === 'vikashdotdev@gmail.com') {
          // Debug logging for non-institution user case
          Logger.info(`[DEBUG] User ${user.email} is NOT an institution user:`, {
            isInstitutionUser: user.isInstitutionUser,
            institutionId: user.institutionId,
            subscriptionPlan: user.subscription?.plan
          });
        }
        return {
          ...user,
          subscription
        };
      })
    );

    return {
      users: usersWithEffectivePlans,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    Logger.error('Error getting users:', error);
    throw error;
  }
};

/**
 * Get user details by ID
 */
const getUserById = async (userId) => {
  try {
    const user = await User.findById(userId)
      .populate('institutionId')
      .lean();

    if (!user) {
      throw new Error('User not found');
    }

    // Get effective plan for institution users
    let subscription = user.subscription;
    if (user.isInstitutionUser && user.institutionId) {
      try {
        const userDoc = await User.findById(userId);
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
        Logger.error(`Error getting effective plan for user ${userId}`, error);
      }
    }

    // Get user's presentations
    const presentations = await Presentation.find({ userId: userId })
      .select('title isLive accessCode createdAt')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // Get user's payments
    const payments = await Payment.find({ userId: userId })
      .select('amount plan status createdAt')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    return {
      user: {
        ...user,
        subscription
      },
      presentations,
      payments
    };
  } catch (error) {
    Logger.error('Error getting user by ID:', error);
    throw error;
  }
};

module.exports = {
  getUsers,
  getUserById
};
