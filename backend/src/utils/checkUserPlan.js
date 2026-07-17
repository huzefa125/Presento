/**
 * Utility script to check user plan details
 * This can be used for debugging user subscription issues
 */

const User = require('../models/User');
const Institution = require('../models/Institution');
const { getEffectivePlan } = require('../services/institutionPlanService');
const Logger = require('./logger');

/**
 * Check and log detailed plan information for a user
 * @param {string} userEmail - User email to check
 */
const checkUserPlanDetails = async (userEmail) => {
  try {
    const user = await User.findOne({ email: userEmail.toLowerCase().trim() });
    
    if (!user) {
      Logger.info(`User with email ${userEmail} not found`);
      return null;
    }

    const details = {
      email: user.email,
      displayName: user.displayName,
      isInstitutionUser: user.isInstitutionUser,
      institutionId: user.institutionId,
      subscription: {
        plan: user.subscription?.plan,
        status: user.subscription?.status,
        startDate: user.subscription?.startDate,
        endDate: user.subscription?.endDate,
        originalPlan: user.subscription?.originalPlan
      },
      effectivePlan: null,
      institutionDetails: null
    };

    // Get effective plan if user is institution user
    if (user.isInstitutionUser && user.institutionId) {
      try {
        const effectivePlan = await getEffectivePlan(user);
        details.effectivePlan = effectivePlan;

        // Get institution details
        const institution = await Institution.findById(user.institutionId);
        if (institution) {
          details.institutionDetails = {
            name: institution.name,
            email: institution.email,
            adminEmail: institution.adminEmail,
            subscription: {
              plan: institution.subscription?.plan,
              status: institution.subscription?.status,
              startDate: institution.subscription?.startDate,
              endDate: institution.subscription?.endDate
            }
          };
        }
      } catch (error) {
        Logger.error(`Error getting effective plan for user ${userEmail}:`, error);
        details.effectivePlanError = error.message;
      }
    }

    return details;
  } catch (error) {
    Logger.error(`Error checking user plan for ${userEmail}:`, error);
    throw error;
  }
};

module.exports = {
  checkUserPlanDetails
};

