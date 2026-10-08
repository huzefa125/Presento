/**
 * Super Admin Service - dashboard
 * Split out of the former superAdminService.js monolith; see ../../../CODE_STANDARDS.md
 */
const User = require('../../models/User');
const Institution = require('../../models/Institution');
const Payment = require('../../models/Payment');
const Presentation = require('../../models/Presentation');
const Logger = require('../../utils/logger');
const { getEffectivePlan } = require('../institutionPlanService');

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
  getGrowthTrends
};
