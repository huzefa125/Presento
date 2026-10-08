/**
 * Super Admin Service - payments
 * Split out of the former superAdminService.js monolith; see ../../../CODE_STANDARDS.md
 */
const User = require('../../models/User');
const Payment = require('../../models/Payment');
const Logger = require('../../utils/logger');

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

module.exports = {
  getPayments,
  getPaymentStats
};
