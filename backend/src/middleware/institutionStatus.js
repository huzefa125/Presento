const Institution = require('../models/Institution');
const { AppError, asyncHandler } = require('./errorHandler');
const { isInstitutionSubscriptionActive } = require('../services/institutionPlanService');

const ensureActiveInstitution = asyncHandler(async (req, res, next) => {
  const institutionId = req.institution?._id || req.institutionId || req.user?.institutionId;

  if (!institutionId) {
    return next();
  }

  const institution = req.institution || await Institution.findById(institutionId);

  if (!institution || !institution.isActive || !isInstitutionSubscriptionActive(institution)) {
    throw new AppError('Institution access is disabled. Please contact your institution administrator.', 403, 'INSTITUTION_DISABLED');
  }

  req.institution = institution;
  req.institutionId = institution._id;
  return next();
});

module.exports = {
  ensureActiveInstitution
};
