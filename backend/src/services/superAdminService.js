const User = require('../models/User');
const Institution = require('../models/Institution');
const Payment = require('../models/Payment');
const Presentation = require('../models/Presentation');
const Response = require('../models/Response');
const Logger = require('../utils/logger');
const { getEffectivePlan } = require('./institutionPlanService');

/**
 * Get overall platform statistics
 */
const getPlatformStats = async () => {
  try {
    const [
      totalUsers,
      activeUsers,
      totalInstitutions,
      activeInstitutions,
      totalPayments,
      totalPresentations,
      activePresentations
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({
        $or: [
          {
            'subscription.status': 'active',
            'subscription.plan': { $in: ['pro', 'lifetime', 'institution'] }
          },
          {
            isInstitutionUser: true,
            institutionId: { $exists: true, $ne: null }
          }
        ]
      }),
      Institution.countDocuments(),
      Institution.countDocuments({ 'subscription.status': 'active' }),
      Payment.countDocuments({ status: 'captured' }),
      Presentation.countDocuments(),
      Presentation.countDocuments({ isLive: true })
    ]);

    // Get users by plan (including effective plans for institution users)
    // First get all users and calculate effective plans
    const allUsers = await User.find({}).lean();
    const planCounts = {
      free: 0,
      pro: 0,
      lifetime: 0,
      institution: 0
    };

    for (const user of allUsers) {
      let plan = user.subscription?.plan || 'free';
      
      // If institution user, get effective plan
      if (user.isInstitutionUser && user.institutionId) {
        try {
          const userDoc = await User.findById(user._id);
          if (userDoc) {
            const effectivePlan = await getEffectivePlan(userDoc);
            plan = effectivePlan.plan;
          }
        } catch (error) {
          Logger.error(`Error getting effective plan for user ${user._id} in stats`, error);
        }
      }
      
      planCounts[plan] = (planCounts[plan] || 0) + 1;
    }

    const usersByPlan = Object.entries(planCounts).map(([plan, count]) => ({
      _id: plan,
      count
    }));

    // Get recent registrations (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const newUsers = await User.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });

    const newInstitutions = await Institution.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });

    // Calculate revenue
    const revenueData = await Payment.aggregate([
      {
        $match: { status: 'captured' }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$amount' },
          monthlyRevenue: {
            $sum: {
              $cond: [
                { $gte: ['$createdAt', thirtyDaysAgo] },
                '$amount',
                0
              ]
            }
          }
        }
      }
    ]);

    const revenue = revenueData[0] || { totalRevenue: 0, monthlyRevenue: 0 };

    // Get institution users count
    const institutionUsers = await User.countDocuments({
      isInstitutionUser: true
    });

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
        new: newUsers,
        byPlan: usersByPlan.reduce((acc, item) => {
          acc[item._id || 'free'] = item.count;
          return acc;
        }, {}),
        institutionUsers
      },
      institutions: {
        total: totalInstitutions,
        active: activeInstitutions,
        new: newInstitutions
      },
      payments: {
        total: totalPayments
      },
      presentations: {
        total: totalPresentations,
        active: activePresentations
      },
      revenue: {
        total: revenue.totalRevenue,
        monthly: revenue.monthlyRevenue
      }
    };
  } catch (error) {
    Logger.error('Error getting platform stats:', error);
    throw error;
  }
};

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

/**
 * Get payments list with filters and pagination
 */
const getPayments = async (filters = {}, page = 1, limit = 50) => {
  try {
    const query = {};

    // Status filter
    if (filters.status) {
      query.status = filters.status;
    }

    // Plan filter
    if (filters.plan) {
      query.plan = filters.plan;
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

    const [payments, total] = await Promise.all([
      Payment.find(query)
        .populate('userId', 'email displayName')
        .populate('institutionId', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Payment.countDocuments(query)
    ]);

    return {
      payments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    Logger.error('Error getting payments:', error);
    throw error;
  }
};

/**
 * Get payment statistics
 */
const getPaymentStats = async () => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      totalRevenue,
      monthlyRevenue,
      totalPayments,
      successfulPayments,
      failedPayments,
      revenueByPlan
    ] = await Promise.all([
      Payment.aggregate([
        { $match: { status: 'captured' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Payment.aggregate([
        {
          $match: {
            status: 'captured',
            createdAt: { $gte: thirtyDaysAgo }
          }
        },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Payment.countDocuments(),
      Payment.countDocuments({ status: 'captured' }),
      Payment.countDocuments({ status: 'failed' }),
      Payment.aggregate([
        { $match: { status: 'captured' } },
        {
          $group: {
            _id: '$plan',
            total: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    // Calculate MRR (Monthly Recurring Revenue)
    const mrr = monthlyRevenue[0]?.total || 0;

    // Calculate ARPU (Average Revenue Per User)
    const activePaidUsers = await User.countDocuments({
      'subscription.status': 'active',
      'subscription.plan': { $in: ['pro', 'lifetime', 'institution'] }
    });
    const arpu = activePaidUsers > 0 ? mrr / activePaidUsers : 0;

    return {
      totalRevenue: totalRevenue[0]?.total || 0,
      monthlyRevenue: mrr,
      totalPayments,
      successfulPayments,
      failedPayments,
      revenueByPlan: revenueByPlan.reduce((acc, item) => {
        acc[item._id] = {
          revenue: item.total,
          count: item.count
        };
        return acc;
      }, {}),
      mrr,
      arpu: Math.round(arpu * 100) / 100
    };
  } catch (error) {
    Logger.error('Error getting payment stats:', error);
    throw error;
  }
};

/**
 * Get presentations list with filters and pagination
 */
const getPresentations = async (filters = {}, page = 1, limit = 50) => {
  try {
    const query = {};

    // Search filter
    if (filters.search) {
      query.title = { $regex: filters.search, $options: 'i' };
    }

    // Live filter
    if (filters.isLive !== undefined) {
      query.isLive = filters.isLive === 'true';
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

    const [presentations, total] = await Promise.all([
      Presentation.find(query)
        .populate('userId', 'email displayName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Presentation.countDocuments(query)
    ]);

    return {
      presentations,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    Logger.error('Error getting presentations:', error);
    throw error;
  }
};

/**
 * Get Growth Trends
 */
const getGrowthTrends = async (days = 30) => {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // User growth
    const userGrowth = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);

    // Revenue growth
    const revenueGrowth = await Payment.aggregate([
      {
        $match: {
          status: 'captured',
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          revenue: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);

    // Institution growth
    const institutionGrowth = await Institution.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);

    // Format data for charts
    const formatData = (data, type) => {
      return data.map(item => ({
        date: `${item._id.year}-${String(item._id.month).padStart(2, '0')}-${String(item._id.day).padStart(2, '0')}`,
        value: type === 'revenue' ? item.revenue : item.count,
        count: item.count || 0
      }));
    };

    return {
      users: formatData(userGrowth, 'count'),
      revenue: formatData(revenueGrowth, 'revenue'),
      institutions: formatData(institutionGrowth, 'count')
    };
  } catch (error) {
    Logger.error('Error getting growth trends:', error);
    throw error;
  }
};

module.exports = {
  getPlatformStats,
  getUsers,
  getUserById,
  getInstitutions,
  getInstitutionById,
  getPayments,
  getPaymentStats,
  getPresentations,
  getGrowthTrends
};

