/**
 * Super Admin Service - presentations
 * Split out of the former superAdminService.js monolith; see ../../../CODE_STANDARDS.md
 */
const Presentation = require('../../models/Presentation');
const Logger = require('../../utils/logger');

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

module.exports = {
  getPresentations
};
